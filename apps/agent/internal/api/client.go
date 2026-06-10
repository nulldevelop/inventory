package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"

	"windows-hw-agent/internal/config"
	"windows-hw-agent/internal/metrics"
)

type Client struct {
	config config.Config
	client *http.Client
}

func NewClient(cfg config.Config) *Client {
	return &Client{
		config: cfg,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type CommandResponse struct {
	Action string `json:"action"`
}

func (c *Client) FetchCommand(hostname string) (string, error) {
	u, err := url.Parse(c.config.CommandsUrl)
	if err != nil {
		return "", fmt.Errorf("invalid commands URL: %v", err)
	}
	q := u.Query()
	q.Set("hostname", hostname)
	u.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.config.ApiToken))

	resp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", nil
	}

	var cmd CommandResponse
	if err := json.NewDecoder(resp.Body).Decode(&cmd); err != nil {
		return "", err
	}
	return cmd.Action, nil
}

func (c *Client) SendMetrics(payload *metrics.Payload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %v", err)
	}

	var lastErr error
	for i := 0; i < c.config.RetryMax; i++ {
		req, err := http.NewRequest("POST", c.config.ApiUrl, bytes.NewBuffer(data))
		if err != nil {
			return fmt.Errorf("request create error: %v", err)
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.config.ApiToken))

		resp, err := c.client.Do(req)
		if err == nil {
			defer func(Body io.ReadCloser) {
				err := Body.Close()
				if err != nil {

				}
			}(resp.Body)
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				log.Printf("Metrics successfully sent to %s (Status: %d)", c.config.ApiUrl, resp.StatusCode)
				return nil
			}
			lastErr = fmt.Errorf("server returned error status: %d", resp.StatusCode)
		} else {
			lastErr = err
		}

		log.Printf("Attempt %d failed to send metrics: %v. Retrying in %v...", i+1, lastErr, c.config.RetryBackoff)
		time.Sleep(c.config.RetryBackoff)
	}

	return fmt.Errorf("failed after %d attempts: %v", c.config.RetryMax, lastErr)
}
