package metrics

import "golang.org/x/sys/windows/registry"

// registryPath é onde o instalador (WiX) grava o cadastro informado na instalação.
const registryPath = `SOFTWARE\NetWatch\Agent`

// getRegistration lê os dados de cadastro de HKLM\SOFTWARE\NetWatch\Agent.
// Usa a visão nativa 64-bit (registry.WOW64_64KEY) para bater com a gravação
// do componente WiX marcado como Win64="yes". Valores ausentes retornam "".
func getRegistration() Registration {
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, registryPath, registry.QUERY_VALUE|registry.WOW64_64KEY)
	if err != nil {
		return Registration{}
	}
	defer k.Close()

	readString := func(name string) string {
		v, _, err := k.GetStringValue(name)
		if err != nil {
			return ""
		}
		return v
	}

	return Registration{
		UserName:     readString("UserName"),
		Secretaria:   readString("Secretaria"),
		Departamento: readString("Departamento"),
	}
}
