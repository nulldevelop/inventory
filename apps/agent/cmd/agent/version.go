package main

// Version is set at build time via ldflags:
//
//	go build -ldflags "-X main.Version=1.0.0" ./cmd/agent/
var Version = "production"
