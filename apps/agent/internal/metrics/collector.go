package metrics

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	gopsnet "github.com/shirou/gopsutil/v3/net"
)

// Payload é o inventário de hardware/identidade enviado a cada telemetria.
// Métricas de uso em tempo real (CPU/RAM/disco/rede/temperatura) NÃO fazem
// parte do inventário e por isso não são coletadas.
type Payload struct {
	Timestamp time.Time `json:"timestamp"`
	Hostname  string    `json:"hostname"`
	OS        string    `json:"os"`
	Platform  string    `json:"platform"`
	Uptime    uint64    `json:"uptime_seconds"`

	// CPU
	CPUModel         string  `json:"cpu_model"`
	CPUVendor        string  `json:"cpu_vendor"`
	CPUFrequency     float64 `json:"cpu_frequency_mhz"`
	CPUPhysicalCores int     `json:"cpu_physical_cores"`
	CPULogicalCores  int     `json:"cpu_logical_cores"`

	// Memory
	Memory MemStats `json:"memory"`

	// Storage
	Disks []DiskDetail `json:"disks"`

	// Network
	Network []NetDetail `json:"network"`

	// GPU
	GPUs []GPUDetail `json:"gpus"`

	// System
	SystemInfo  SystemDetail      `json:"system"`
	BIOS        BIOSDetail        `json:"bios"`
	Motherboard MotherboardDetail `json:"motherboard"`

	// Optional
	DefenderEnabled bool   `json:"defender_enabled"`
	AnyDeskID       string `json:"anydesk_id,omitempty"`

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
	Total uint64    `json:"total_bytes"`
	Slots []RAMSlot `json:"slots"`
}

type RAMSlot struct {
	Slot          string `json:"slot"`
	Manufacturer  string `json:"manufacturer"`
	SpeedMHz      uint32 `json:"speed_mhz"`
	CapacityBytes uint64 `json:"capacity_bytes"`
}

type DiskDetail struct {
	Device       string `json:"device"`
	Mountpoint   string `json:"mountpoint"`
	FSType       string `json:"fstype"`
	Total        uint64 `json:"total_bytes"`
	Model        string `json:"model"`
	Manufacturer string `json:"manufacturer"`
}

type NetDetail struct {
	Interface string   `json:"interface"`
	IPs       []string `json:"ips"`
	MAC       string   `json:"mac"`
}

type GPUDetail struct {
	Model          string `json:"model"`
	VRAMTotalBytes uint64 `json:"vram_total_bytes"`
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

// Collector coleta o inventário. É stateless — o inventário é um snapshot
// completo a cada envio, sem deltas entre coletas.
type Collector struct{}

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

func getGPUs() []GPUDetail {
	// Each line: Name|AdapterRAM|DriverVersion
	out := getPowerShellDetail(`Get-CimInstance Win32_VideoController | ForEach-Object { "$($_.Name)|$($_.AdapterRAM)|$($_.DriverVersion)" }`)
	if out == "Unknown" {
		return nil
	}

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

		gpus = append(gpus, GPUDetail{
			Model:          strings.TrimSpace(parts[0]),
			VRAMTotalBytes: vramTotal,
			DriverVersion:  strings.TrimSpace(parts[2]),
		})
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

	// Disk partitions — apenas capacidade/identificação (inventário).
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
			Model:        diskModel,
			Manufacturer: diskMfg,
		})
	}

	// Network — apenas identificação (interface/IPs/MAC).
	interfaces, _ := gopsnet.InterfacesWithContext(ctx)
	var netDetails []NetDetail
	for _, iface := range interfaces {
		if len(iface.Addrs) == 0 {
			continue
		}
		var ips []string
		for _, addr := range iface.Addrs {
			ips = append(ips, addr.Addr)
		}
		netDetails = append(netDetails, NetDetail{
			Interface: iface.Name,
			IPs:       ips,
			MAC:       iface.HardwareAddr,
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
		CPUFrequency:     freq,
		CPUPhysicalCores: physicalCores,
		CPULogicalCores:  logicalCores,
		Memory: MemStats{
			Total: vMem.Total,
			Slots: getRAMSlots(),
		},
		Disks:   diskDetails,
		Network: netDetails,
		GPUs:    getGPUs(),
		SystemInfo: SystemDetail{
			Manufacturer: getPowerShellDetail("(Get-CimInstance Win32_ComputerSystem).Manufacturer"),
			Model:        getPowerShellDetail("(Get-CimInstance Win32_ComputerSystem).Model"),
			SerialNumber: hInfo.HostID,
		},
		BIOS:            getBIOS(),
		Motherboard:     getMotherboard(),
		DefenderEnabled: getDefenderStatus(),
		AnyDeskID:       getAnyDeskID(),
		Registration:    getRegistration(),
		AgentVersion:    agentVersion,
	}

	return payload, nil
}
