package metrics

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	gopsnet "github.com/shirou/gopsutil/v3/net"
)

type Payload struct {
	Timestamp time.Time `json:"timestamp"`
	Hostname  string    `json:"hostname"`
	OS        string    `json:"os"`
	Platform  string    `json:"platform"`
	Uptime    uint64    `json:"uptime_seconds"`

	// CPU
	CPUModel         string    `json:"cpu_model"`
	CPUVendor        string    `json:"cpu_vendor"`
	CPUUsage         float64   `json:"cpu_usage_percent"`
	CPUFrequency     float64   `json:"cpu_frequency_mhz"`
	CPUPhysicalCores int       `json:"cpu_physical_cores"`
	CPULogicalCores  int       `json:"cpu_logical_cores"`
	CPUUsagePerCore  []float64 `json:"cpu_usage_per_core"`
	CPUTemp          float64   `json:"cpu_temp"`

	// Memory
	Memory MemStats `json:"memory"`

	// Storage
	Disks  []DiskDetail   `json:"disks"`
	DiskIO []DiskIODetail `json:"disk_io"`

	// Network
	Network []NetDetail `json:"network"`

	// GPU
	GPUs []GPUDetail `json:"gpus"`

	// System
	SystemInfo  SystemDetail      `json:"system"`
	BIOS        BIOSDetail        `json:"bios"`
	Motherboard MotherboardDetail `json:"motherboard"`

	// Optional
	Battery         *BatteryDetail `json:"battery,omitempty"`
	DefenderEnabled bool           `json:"defender_enabled"`
	AnyDeskID       string         `json:"anydesk_id,omitempty"`

	// Cadastro coletado na instalação (Nome/Secretaria/Departamento)
	Registration Registration `json:"registration"`

	// Versão do Agente
	AgentVersion string `json:"agent_version"`
}

// Registration são os dados informados na tela de instalação, gravados no
// registro do Windows e reenviados a cada telemetria.
type Registration struct {
	UserName     string `json:"user_name"`
	Secretaria   string `json:"secretaria"`
	Departamento string `json:"departamento"`
}

type MemStats struct {
	Total      uint64    `json:"total_bytes"`
	Used       uint64    `json:"used_bytes"`
	Free       uint64    `json:"free_bytes"`
	Percentage float64   `json:"percentage"`
	Slots      []RAMSlot `json:"slots"`
}

type RAMSlot struct {
	Slot          string `json:"slot"`
	Manufacturer  string `json:"manufacturer"`
	SpeedMHz      uint32 `json:"speed_mhz"`
	CapacityBytes uint64 `json:"capacity_bytes"`
}

type DiskDetail struct {
	Device       string  `json:"device"`
	Mountpoint   string  `json:"mountpoint"`
	FSType       string  `json:"fstype"`
	Total        uint64  `json:"total_bytes"`
	Used         uint64  `json:"used_bytes"`
	Free         uint64  `json:"free_bytes"`
	Percentage   float64 `json:"percentage"`
	Model        string  `json:"model"`
	Manufacturer string  `json:"manufacturer"`
}

type DiskIODetail struct {
	Device           string `json:"device"`
	ReadBytesPerSec  uint64 `json:"read_bytes_per_sec"`
	WriteBytesPerSec uint64 `json:"write_bytes_per_sec"`
}

type NetDetail struct {
	Interface  string   `json:"interface"`
	IPs        []string `json:"ips"`
	MAC        string   `json:"mac"`
	Sent       uint64   `json:"bytes_sent"`
	Recv       uint64   `json:"bytes_recv"`
	SentPerSec uint64   `json:"bytes_sent_per_sec"`
	RecvPerSec uint64   `json:"bytes_recv_per_sec"`
}

type GPUDetail struct {
	Model          string `json:"model"`
	VRAMTotalBytes uint64 `json:"vram_total_bytes"`
	VRAMUsedBytes  uint64 `json:"vram_used_bytes"`
	DriverVersion  string `json:"driver_version"`
}

type SystemDetail struct {
	Manufacturer string `json:"manufacturer"`
	Model        string `json:"model"`
	SerialNumber string `json:"serial_number"`
}

type BIOSDetail struct {
	Manufacturer string `json:"manufacturer"`
	Version      string `json:"version"`
	ReleaseDate  string `json:"release_date"`
}

type MotherboardDetail struct {
	Manufacturer string `json:"manufacturer"`
	Model        string `json:"model"`
	SerialNumber string `json:"serial_number"`
}

type BatteryDetail struct {
	ChargePercent float64 `json:"charge_percent"`
	Status        string  `json:"status"`
}

// Collector holds state between collections for delta calculations (disk IO and network speed).
type Collector struct {
	prevNetIO  map[string]gopsnet.IOCountersStat
	prevDiskIO map[string]disk.IOCountersStat
	prevTime   time.Time
}

func NewCollector() *Collector {
	return &Collector{}
}

func getPowerShellDetail(command string) string {
	out, err := exec.Command("powershell", "-NoProfile", "-Command", command).Output()
	if err != nil {
		return "Unknown"
	}
	res := strings.TrimSpace(string(out))
	if res == "" {
		return "Unknown"
	}
	return res
}

func getCPUTemp() float64 {
	cmds := []string{
		"(Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature).CurrentTemperature",
		"(Get-CimInstance -Namespace root/cimv2 -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation).Temperature",
	}

	var bestTemp float64
	for _, cmd := range cmds {
		out := getPowerShellDetail(cmd)
		if out == "Unknown" {
			continue
		}
		for _, part := range strings.Fields(out) {
			val, err := strconv.ParseFloat(part, 64)
			if err != nil {
				continue
			}
			var t float64
			if val > 1000 {
				t = (val / 10.0) - 273.15
			} else if val > 200 {
				t = val - 273.15
			} else {
				t = val
			}
			if t > 25 && t < 115 && t > bestTemp {
				bestTemp = t
			}
		}
	}
	return bestTemp
}

func getGPUs() []GPUDetail {
	// Each line: Name|AdapterRAM|DriverVersion
	out := getPowerShellDetail(`Get-CimInstance Win32_VideoController | ForEach-Object { "$($_.Name)|$($_.AdapterRAM)|$($_.DriverVersion)" }`)
	if out == "Unknown" {
		return nil
	}

	// Try to get total dedicated VRAM in use across all GPUs via performance counters.
	// This is best-effort; returns 0 if counters are unavailable.
	vramUsedStr := getPowerShellDetail(
		`try { (Get-CimInstance -ClassName 'Win32_PerfFormattedData_GPUPerformanceCounters_GPUAdapterMemory' -ErrorAction Stop | Measure-Object -Property DedicatedUsage -Sum).Sum } catch { 0 }`,
	)
	var totalVRAMUsed uint64
	fmt.Sscanf(strings.TrimSpace(vramUsedStr), "%d", &totalVRAMUsed)

	var gpus []GPUDetail
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, "|")
		if len(parts) < 3 {
			continue
		}
		var vramTotal uint64
		fmt.Sscanf(strings.TrimSpace(parts[1]), "%d", &vramTotal)

		// Distribute total used VRAM evenly when there are multiple GPUs.
		// Single-GPU systems get the full value.
		gpus = append(gpus, GPUDetail{
			Model:          strings.TrimSpace(parts[0]),
			VRAMTotalBytes: vramTotal,
			DriverVersion:  strings.TrimSpace(parts[2]),
		})
	}

	// Assign vram_used only for single-GPU systems (reliable mapping).
	if len(gpus) == 1 {
		gpus[0].VRAMUsedBytes = totalVRAMUsed
	}

	return gpus
}

func getRAMSlots() []RAMSlot {
	// Each line: DeviceLocator|Manufacturer|Speed|Capacity
	out := getPowerShellDetail(`Get-CimInstance Win32_PhysicalMemory | ForEach-Object { "$($_.DeviceLocator)|$($_.Manufacturer)|$($_.Speed)|$($_.Capacity)" }`)
	if out == "Unknown" {
		return nil
	}

	var slots []RAMSlot
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		parts := strings.Split(line, "|")
		if len(parts) < 4 {
			continue
		}
		var speed uint32
		var capacity uint64
		fmt.Sscanf(strings.TrimSpace(parts[2]), "%d", &speed)
		fmt.Sscanf(strings.TrimSpace(parts[3]), "%d", &capacity)
		mfg := strings.TrimSpace(parts[1])
		if mfg == "" {
			mfg = "Unknown"
		}
		slots = append(slots, RAMSlot{
			Slot:          strings.TrimSpace(parts[0]),
			Manufacturer:  mfg,
			SpeedMHz:      speed,
			CapacityBytes: capacity,
		})
	}
	return slots
}

func getBIOS() BIOSDetail {
	out := getPowerShellDetail(`$b = Get-CimInstance Win32_BIOS | Select-Object -First 1; "$($b.Manufacturer)|$($b.SMBIOSBIOSVersion)|$(if ($b.ReleaseDate) { $b.ReleaseDate.ToString('yyyy-MM-dd') } else { 'Unknown' })"`)
	if out == "Unknown" {
		return BIOSDetail{}
	}
	parts := strings.Split(out, "|")
	if len(parts) < 3 {
		return BIOSDetail{}
	}
	return BIOSDetail{
		Manufacturer: strings.TrimSpace(parts[0]),
		Version:      strings.TrimSpace(parts[1]),
		ReleaseDate:  strings.TrimSpace(parts[2]),
	}
}

func getMotherboard() MotherboardDetail {
	out := getPowerShellDetail(`$b = Get-CimInstance Win32_BaseBoard | Select-Object -First 1; "$($b.Manufacturer)|$($b.Product)|$($b.SerialNumber)"`)
	if out == "Unknown" {
		return MotherboardDetail{}
	}
	parts := strings.Split(out, "|")
	if len(parts) < 3 {
		return MotherboardDetail{}
	}
	return MotherboardDetail{
		Manufacturer: strings.TrimSpace(parts[0]),
		Model:        strings.TrimSpace(parts[1]),
		SerialNumber: strings.TrimSpace(parts[2]),
	}
}

var batteryStatusMap = map[int]string{
	1: "Other", 2: "Unknown", 3: "Full", 4: "Low",
	5: "Critical", 6: "Charging", 7: "Charging/High",
	8: "Charging/Low", 9: "Charging/Critical", 11: "Partially Charged",
}

func getBattery() *BatteryDetail {
	out := getPowerShellDetail(`$b = Get-CimInstance Win32_Battery | Select-Object -First 1; if ($b) { "$($b.EstimatedChargeRemaining)|$($b.BatteryStatus)" }`)
	if out == "Unknown" || out == "" {
		return nil
	}
	parts := strings.Split(out, "|")
	if len(parts) < 2 {
		return nil
	}
	var charge float64
	var statusCode int
	fmt.Sscanf(strings.TrimSpace(parts[0]), "%f", &charge)
	fmt.Sscanf(strings.TrimSpace(parts[1]), "%d", &statusCode)

	status, ok := batteryStatusMap[statusCode]
	if !ok {
		status = "Unknown"
	}
	return &BatteryDetail{
		ChargePercent: charge,
		Status:        status,
	}
}

func getAnyDeskID() string {
	data, err := os.ReadFile(`C:\ProgramData\AnyDesk\system.conf`)
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "ad.anynet.id=") {
			return strings.TrimPrefix(line, "ad.anynet.id=")
		}
	}
	return ""
}

func getDefenderStatus() bool {
	out := getPowerShellDetail(`try { (Get-MpComputerStatus -ErrorAction Stop).AntivirusEnabled } catch { 'false' }`)
	return strings.TrimSpace(strings.ToLower(out)) == "true"
}

func (c *Collector) Collect(agentVersion string) (*Payload, error) {
	ctx := context.Background()
	now := time.Now()

	hInfo, _ := host.InfoWithContext(ctx)

	// Per-core usage (blocks for 1s); total is computed as average.
	cpuUsagePerCore, _ := cpu.PercentWithContext(ctx, time.Second, true)
	var cpuUsageTotal float64
	for _, v := range cpuUsagePerCore {
		cpuUsageTotal += v
	}
	if len(cpuUsagePerCore) > 0 {
		cpuUsageTotal /= float64(len(cpuUsagePerCore))
	}

	cpuInfo, _ := cpu.InfoWithContext(ctx)
	physicalCores, _ := cpu.Counts(false)
	logicalCores, _ := cpu.Counts(true)

	var freq float64
	var cpuModel, cpuVendor string
	if len(cpuInfo) > 0 {
		freq = cpuInfo[0].Mhz
		cpuModel = cpuInfo[0].ModelName
		cpuVendor = cpuInfo[0].VendorID
	}

	vMem, _ := mem.VirtualMemoryWithContext(ctx)

	// Disk partitions
	partitions, _ := disk.PartitionsWithContext(ctx, false)
	var diskDetails []DiskDetail
	for _, p := range partitions {
		usage, err := disk.UsageWithContext(ctx, p.Mountpoint)
		if err != nil {
			continue
		}
		driveLetter := strings.TrimSuffix(p.Mountpoint, ":\\")
		diskModel := getPowerShellDetail(fmt.Sprintf("(Get-Partition -DriveLetter '%s' | Get-Disk).Model", driveLetter))
		diskMfg := getPowerShellDetail(fmt.Sprintf("(Get-Partition -DriveLetter '%s' | Get-Disk).Manufacturer", driveLetter))
		diskDetails = append(diskDetails, DiskDetail{
			Device:       p.Device,
			Mountpoint:   p.Mountpoint,
			FSType:       p.Fstype,
			Total:        usage.Total,
			Used:         usage.Used,
			Free:         usage.Free,
			Percentage:   usage.UsedPercent,
			Model:        diskModel,
			Manufacturer: diskMfg,
		})
	}

	// Disk IO delta
	elapsed := now.Sub(c.prevTime).Seconds()
	if elapsed <= 0 {
		elapsed = 1
	}

	currentDiskIO, _ := disk.IOCounters()
	var diskIODetails []DiskIODetail
	for name, curr := range currentDiskIO {
		var readPerSec, writePerSec uint64
		if c.prevDiskIO != nil {
			if prev, ok := c.prevDiskIO[name]; ok {
				readDelta := curr.ReadBytes - prev.ReadBytes
				writeDelta := curr.WriteBytes - prev.WriteBytes
				readPerSec = uint64(float64(readDelta) / elapsed)
				writePerSec = uint64(float64(writeDelta) / elapsed)
			}
		}
		diskIODetails = append(diskIODetails, DiskIODetail{
			Device:           name,
			ReadBytesPerSec:  readPerSec,
			WriteBytesPerSec: writePerSec,
		})
	}

	// Network
	interfaces, _ := gopsnet.InterfacesWithContext(ctx)
	currentNetIO, _ := gopsnet.IOCountersWithContext(ctx, true)

	currentNetMap := make(map[string]gopsnet.IOCountersStat)
	for _, io := range currentNetIO {
		currentNetMap[io.Name] = io
	}

	var netDetails []NetDetail
	for _, iface := range interfaces {
		if len(iface.Addrs) == 0 {
			continue
		}
		curr, hasCurr := currentNetMap[iface.Name]
		var sent, recv, sentPerSec, recvPerSec uint64
		if hasCurr {
			sent = curr.BytesSent
			recv = curr.BytesRecv
			if c.prevNetIO != nil {
				if prev, ok := c.prevNetIO[iface.Name]; ok {
					sentDelta := curr.BytesSent - prev.BytesSent
					recvDelta := curr.BytesRecv - prev.BytesRecv
					sentPerSec = uint64(float64(sentDelta) / elapsed)
					recvPerSec = uint64(float64(recvDelta) / elapsed)
				}
			}
		}
		var ips []string
		for _, addr := range iface.Addrs {
			ips = append(ips, addr.Addr)
		}
		netDetails = append(netDetails, NetDetail{
			Interface:  iface.Name,
			IPs:        ips,
			MAC:        iface.HardwareAddr,
			Sent:       sent,
			Recv:       recv,
			SentPerSec: sentPerSec,
			RecvPerSec: recvPerSec,
		})
	}

	payload := &Payload{
		Timestamp:        now,
		Hostname:         hInfo.Hostname,
		OS:               fmt.Sprintf("%s %s", hInfo.OS, hInfo.PlatformVersion),
		Platform:         hInfo.Platform,
		Uptime:           hInfo.Uptime,
		CPUModel:         cpuModel,
		CPUVendor:        cpuVendor,
		CPUUsage:         cpuUsageTotal,
		CPUFrequency:     freq,
		CPUPhysicalCores: physicalCores,
		CPULogicalCores:  logicalCores,
		CPUUsagePerCore:  cpuUsagePerCore,
		CPUTemp:          getCPUTemp(),
		Memory: MemStats{
			Total:      vMem.Total,
			Used:       vMem.Used,
			Free:       vMem.Free,
			Percentage: vMem.UsedPercent,
			Slots:      getRAMSlots(),
		},
		Disks:   diskDetails,
		DiskIO:  diskIODetails,
		Network: netDetails,
		GPUs:    getGPUs(),
		SystemInfo: SystemDetail{
			Manufacturer: getPowerShellDetail("(Get-CimInstance Win32_ComputerSystem).Manufacturer"),
			Model:        getPowerShellDetail("(Get-CimInstance Win32_ComputerSystem).Model"),
			SerialNumber: hInfo.HostID,
		},
		BIOS:            getBIOS(),
		Motherboard:     getMotherboard(),
		Battery:         getBattery(),
		DefenderEnabled: getDefenderStatus(),
		AnyDeskID:       getAnyDeskID(),
		Registration:    getRegistration(),
		AgentVersion:    agentVersion,
	}

	// Save state for next collection
	c.prevNetIO = currentNetMap
	c.prevDiskIO = currentDiskIO
	c.prevTime = now

	return payload, nil
}
