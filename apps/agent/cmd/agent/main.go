package main

import (
	"log"
	"os"

	"golang.org/x/sys/windows/svc"
	"windows-hw-agent/internal/config"
	"windows-hw-agent/internal/service"
)

const serviceName = "HardwareAgent"

func main() {
	cfg := config.LoadConfig()

	isInt, err := svc.IsAnInteractiveSession()
	if err != nil {
		log.Fatalf("failed to determine if we are running in an interactive session: %v", err)
	}

	if !isInt {
		runService(cfg)
		return
	}

	runConsole(cfg)
}

func runService(cfg config.Config) {
	agentSvc := service.NewAgentService(cfg, Version)
	err := svc.Run(serviceName, agentSvc)
	if err != nil {
		log.Fatalf("service failed: %v", err)
	}
}

func runConsole(cfg config.Config) {
	log.Printf("Running %s v%s in interactive mode...", serviceName, Version)
	agentSvc := service.NewAgentService(cfg, Version)

	// In console mode, we just run the execution loop manually
	// and ignore the status channel for simplicity in this demo.
	// In a real app, you might want a proper CLI controller.
	
	// Create channels to simulate the svc.Handler interface
	r := make(chan svc.ChangeRequest)
	changes := make(chan svc.Status)

	go func() {
		for range changes {
			// consume status changes
		}
	}()

	// Signal stop on Ctrl+C (not fully implemented here for brevity, 
	// but standard Go signal handling applies)
	agentSvc.Execute(os.Args, r, changes)
}
