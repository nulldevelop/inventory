package config

import (
	"net/url"
	"os"
	"strconv"
	"time"
)

type Config struct {
	ApiUrl          string
	CommandsUrl     string
	UpdateUrl       string
	ApiToken        string
	Interval        time.Duration
	UpdateInterval  time.Duration
	CommandInterval time.Duration
	RetryMax        int
	RetryBackoff    time.Duration
}

// envSeconds lê uma variável de ambiente em segundos; usa o default se ausente/inválida.
func envSeconds(name string, def time.Duration) time.Duration {
	v, err := strconv.Atoi(os.Getenv(name))
	if err != nil || v <= 0 {
		return def
	}
	return time.Duration(v) * time.Second
}

func LoadConfig() Config {
	apiUrl := os.Getenv("AGENT_API_URL")
	if apiUrl == "" {
		// TESTE LOCAL: aponta para o backend rodando em localhost.
		// Reverter para https://netwatch.nullphr.com.br/api/ingest antes de release.
		apiUrl = "http://localhost:3000/api/ingest"
	}

	apiToken := os.Getenv("AGENT_API_TOKEN")
	if apiToken == "" {
		// Fallback para execução local (go run) sem a env var definida.
		// Em produção o instalador WiX define AGENT_API_TOKEN no sistema.
		// Deve casar com AGENT_TOKEN do backend.
		apiToken = "7750acaf865bd4e507c5787e58d7a89b3f18746acde53f8f9cbac70f1638f627"
	}

	// Telemetria: 8h por padrão (override via AGENT_INTERVAL_SECONDS)
	interval := envSeconds("AGENT_INTERVAL_SECONDS", 8*time.Hour)
	// Auto-update: 4h por padrão
	updateInterval := envSeconds("AGENT_UPDATE_INTERVAL_SECONDS", 4*time.Hour)
	// Comandos remotos: 60s por padrão (desacoplado da telemetria)
	commandInterval := envSeconds("AGENT_COMMAND_INTERVAL_SECONDS", 60*time.Second)

	commandsUrl := os.Getenv("AGENT_COMMANDS_URL")
	if commandsUrl == "" {
		if u, err := url.Parse(apiUrl); err == nil {
			u.Path = "/api/commands"
			u.RawQuery = ""
			commandsUrl = u.String()
		} else {
			commandsUrl = "https://netwatch.nullphr.com.br/api/commands"
		}
	}

	updateUrl := os.Getenv("AGENT_UPDATE_URL")
	if updateUrl == "" {
		if u, err := url.Parse(apiUrl); err == nil {
			u.Path = "/api/update"
			u.RawQuery = ""
			updateUrl = u.String()
		} else {
			updateUrl = "https://netwatch.nullphr.com.br/api/update"
		}
	}

	return Config{
		ApiUrl:          apiUrl,
		CommandsUrl:     commandsUrl,
		UpdateUrl:       updateUrl,
		ApiToken:        apiToken,
		Interval:        interval,
		UpdateInterval:  updateInterval,
		CommandInterval: commandInterval,
		RetryMax:        3,
		RetryBackoff:    2 * time.Second,
	}
}
