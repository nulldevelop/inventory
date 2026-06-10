package service

import (
	"log"
	"os"
	"os/exec"
	"time"

	"golang.org/x/sys/windows/svc"
	"windows-hw-agent/internal/api"
	"windows-hw-agent/internal/config"
	"windows-hw-agent/internal/metrics"
	"windows-hw-agent/internal/updater"
)

type AgentService struct {
	config    config.Config
	api       *api.Client
	collector *metrics.Collector
	updater   *updater.Updater
	version   string
}

func NewAgentService(cfg config.Config, version string) *AgentService {
	return &AgentService{
		config:    cfg,
		api:       api.NewClient(cfg),
		collector: metrics.NewCollector(),
		updater:   updater.NewUpdater(cfg),
		version:   version,
	}
}

func (m *AgentService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (ssec bool, errno uint32) {
	const cmdsAccepted = svc.AcceptStop | svc.AcceptShutdown
	changes <- svc.Status{State: svc.StartPending}

	log.Printf("Service Agent started")

	changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}

	// Tickers independentes: telemetria (8h), comandos (60s) e update (4h).
	telemetryTicker := time.NewTicker(m.config.Interval)
	defer telemetryTicker.Stop()
	commandTicker := time.NewTicker(m.config.CommandInterval)
	defer commandTicker.Stop()
	updateTicker := time.NewTicker(m.config.UpdateInterval)
	defer updateTicker.Stop()

	// Coleta/checagem inicial
	m.collectAndSend()
	m.fetchAndExecute()

loop:
	for {
		select {
		case <-telemetryTicker.C:
			m.collectAndSend()
		case <-commandTicker.C:
			m.fetchAndExecute()
		case <-updateTicker.C:
			m.checkForUpdate()
		case c := <-r:
			switch c.Cmd {
			case svc.Interrogate:
				changes <- c.CurrentStatus
			case svc.Stop, svc.Shutdown:
				log.Printf("Stopping service...")
				break loop
			default:
				log.Printf("Unexpected control request #%d", c)
			}
		}
	}

	changes <- svc.Status{State: svc.StopPending}
	return
}

func (m *AgentService) collectAndSend() {
	payload, err := m.collector.Collect(m.version)
	if err != nil {
		log.Printf("Error collecting metrics: %v", err)
		return
	}

	if err := m.api.SendMetrics(payload); err != nil {
		log.Printf("Error sending metrics: %v", err)
	}
}

func (m *AgentService) checkForUpdate() {
	if m.version == "dev" {
		return // Não checa update em modo dev
	}

	info, err := m.updater.CheckUpdate(m.version)
	if err != nil {
		log.Printf("Update check failed: %v", err)
		return
	}

	if !info.UpdateAvailable {
		return
	}

	log.Printf("New version available: %s (current: %s)", info.Version, m.version)
	if err := m.updater.Apply(info); err != nil {
		log.Printf("Update failed: %v", err)
	}
}

func (m *AgentService) fetchAndExecute() {
	hostname, err := os.Hostname()
	if err != nil {
		log.Printf("Error getting hostname: %v", err)
		return
	}

	action, err := m.api.FetchCommand(hostname)
	if err != nil {
		log.Printf("Error fetching command: %v", err)
		return
	}

	switch action {
	case "shutdown":
		log.Printf("Executing shutdown command")
		exec.Command("shutdown", "/s", "/t", "10").Run()
	case "restart":
		log.Printf("Executing restart command")
		exec.Command("shutdown", "/r", "/t", "10").Run()
	case "lock":
		log.Printf("Executing lock command")
		exec.Command("rundll32.exe", "user32.dll,LockWorkStation").Run()
	}
}
