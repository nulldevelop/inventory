package updater

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"windows-hw-agent/internal/config"
)

type UpdateInfo struct {
	UpdateAvailable bool   `json:"update_available"`
	Version         string `json:"version"`
	DownloadURL     string `json:"download_url"`
}

type Updater struct {
	config config.Config
	client *http.Client
}

func NewUpdater(cfg config.Config) *Updater {
	return &Updater{
		config: cfg,
		client: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// CheckUpdate consulta o servidor para verificar se há uma versão nova.
func (u *Updater) CheckUpdate(currentVersion string) (*UpdateInfo, error) {
	updateURL, err := url.Parse(u.config.UpdateUrl)
	if err != nil {
		return nil, fmt.Errorf("invalid update URL: %v", err)
	}
	q := updateURL.Query()
	q.Set("version", currentVersion)
	updateURL.RawQuery = q.Encode()

	req, err := http.NewRequest("GET", updateURL.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", u.config.ApiToken))

	resp, err := u.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("update check returned status %d", resp.StatusCode)
	}

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	return &info, nil
}

// Apply baixa o MSI do S3 e executa msiexec para atualizar silenciosamente.
// O WiX MajorUpgrade cuida de parar o serviço, substituir e reiniciar.
func (u *Updater) Apply(info *UpdateInfo) error {
	tmpDir := os.TempDir()
	msiPath := filepath.Join(tmpDir, "HardwareAgent.msi")

	// 1. Baixa o MSI (presigned URL do S3, sem necessidade de auth header)
	log.Printf("Downloading update v%s ...", info.Version)
	if err := u.download(info.DownloadURL, msiPath); err != nil {
		os.Remove(msiPath)
		return fmt.Errorf("download failed: %v", err)
	}

	log.Printf("MSI downloaded. Running msiexec to upgrade...")

	// 2. Executa msiexec em background — ele vai parar o serviço, instalar e reiniciar
	cmd := exec.Command("msiexec.exe", "/i", msiPath, "/quiet", "/norestart")
	return cmd.Start()
}

func (u *Updater) download(rawURL, dest string) error {
	req, err := http.NewRequest("GET", rawURL, nil)
	if err != nil {
		return err
	}
	// Presigned URL do S3 já tem auth na query string, não precisa de header

	resp, err := u.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download returned status %d", resp.StatusCode)
	}

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}
