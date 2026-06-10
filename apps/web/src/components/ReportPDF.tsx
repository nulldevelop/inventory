import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#666',
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#999',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#999',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    minHeight: 16,
  },
  tableCell: {
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#ddd',
    overflow: 'hidden',
  },
  colHostname: { width: '7%' },
  colCustomName: { width: '10%' },
  colGrupo: { width: '8%' },
  colSubgrupo: { width: '8%' },
  colStatus: { width: '4%' },
  colOS: { width: '10%' },
  colCPU: { width: '14%' },
  colCores: { width: '3%' },
  colRAM: { width: '8%' },
  colHD: { width: '10%' },
  colGPU: { width: '10%' },
  colIP: { width: '8%' },
  colFabricante: { width: '6%' },
  colModelo: { width: '8%' },
  bold: { fontWeight: 'bold' },
  online: { color: '#16a34a' },
  offline: { color: '#dc2626' },
  lastCol: { borderRightWidth: 0 },
})

interface AgentData {
  hostname: string
  customName: string
  grupo: string
  subgrupo: string
  serial: string
  status: string
  lastUpdate: string
  osName: string
  cpu: string
  cpuCores: string
  ramFormat: string
  diskInfo: string
  gpuInfo: string
  ip: string
  mac: string
  manufacturer: string
  model: string
}

export function ReportPDF({ data }: { data: AgentData[] }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Inventário de Máquinas</Text>
          <Text style={styles.subtitle}>
            Gerado em: {new Date().toLocaleString('pt-BR')} | Total de máquinas:{' '}
            {data.length}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.colHostname, styles.bold]}>
              Host
            </Text>
            <Text style={[styles.tableCell, styles.colCustomName, styles.bold]}>
              Nome
            </Text>
            <Text style={[styles.tableCell, styles.colGrupo, styles.bold]}>
              Secretaria
            </Text>
            <Text style={[styles.tableCell, styles.colSubgrupo, styles.bold]}>
              Setor
            </Text>
            <Text style={[styles.tableCell, styles.colStatus, styles.bold]}>
              Status
            </Text>
            <Text style={[styles.tableCell, styles.colOS, styles.bold]}>
              SO
            </Text>
            <Text style={[styles.tableCell, styles.colCPU, styles.bold]}>
              Processador
            </Text>
            <Text style={[styles.tableCell, styles.colCores, styles.bold]}>
              CPU
            </Text>
            <Text style={[styles.tableCell, styles.colRAM, styles.bold]}>
              RAM
            </Text>
            <Text style={[styles.tableCell, styles.colHD, styles.bold]}>
              HD
            </Text>
            <Text style={[styles.tableCell, styles.colGPU, styles.bold]}>
              GPU
            </Text>
            <Text style={[styles.tableCell, styles.colIP, styles.bold]}>
              IP
            </Text>
            <Text style={[styles.tableCell, styles.colFabricante, styles.bold]}>
              Fab.
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.colModelo,
                styles.bold,
                styles.lastCol,
              ]}
            >
              Modelo
            </Text>
          </View>

          {data.map((agent) => (
            <View key={agent.serial} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colHostname]}>
                {agent.hostname}
              </Text>
              <Text style={[styles.tableCell, styles.colCustomName]}>
                {agent.customName}
              </Text>
              <Text style={[styles.tableCell, styles.colGrupo]}>
                {agent.grupo}
              </Text>
              <Text style={[styles.tableCell, styles.colSubgrupo]}>
                {agent.subgrupo}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colStatus,
                  agent.status === 'Online' ? styles.online : styles.offline,
                ]}
              >
                {agent.status}
              </Text>
              <Text style={[styles.tableCell, styles.colOS]}>
                {agent.osName}
              </Text>
              <Text style={[styles.tableCell, styles.colCPU]}>{agent.cpu}</Text>
              <Text style={[styles.tableCell, styles.colCores]}>
                {agent.cpuCores}
              </Text>
              <Text style={[styles.tableCell, styles.colRAM]}>
                {agent.ramFormat}
              </Text>
              <Text style={[styles.tableCell, styles.colHD]}>
                {agent.diskInfo}
              </Text>
              <Text style={[styles.tableCell, styles.colGPU]}>
                {agent.gpuInfo}
              </Text>
              <Text style={[styles.tableCell, styles.colIP]}>{agent.ip}</Text>
              <Text style={[styles.tableCell, styles.colFabricante]}>
                {agent.manufacturer}
              </Text>
              <Text
                style={[styles.tableCell, styles.colModelo, styles.lastCol]}
              >
                {agent.model}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
