# ==============================================================================
# TIC - AUDITOR DE ACTIVOS VS04.1
# Genera un unico TXT en Documentos con payload JSON Base64 compatible con GAS.
# No escribe directamente en Google Sheets.
# ==============================================================================

param(
    [string]$OutputDirectory = "",
    [switch]$OpenFolder
)

$ErrorActionPreference = "SilentlyContinue"

# ------------------------------------------------------------------------------
# CONFIGURACION
# ------------------------------------------------------------------------------

$SchemaVersion = "TIC-AUDIT-V04"
$GeneratedBy = "TIC PowerShell Auditor VS04.1"

# ------------------------------------------------------------------------------
# UTILIDADES
# ------------------------------------------------------------------------------

function Clean-Text {
    param([object]$Value)

    if ($null -eq $Value) { return "" }

    $text = [string]$Value
    $text = $text.Replace("`r", " ").Replace("`n", " ").Trim()

    if ($text -eq "-" -or $text -eq "null" -or $text -eq "undefined") {
        return ""
    }

    return $text
}

function Format-DateTime {
    param([object]$Value)

    try {
        if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) {
            return ""
        }

        return ([datetime]$Value).ToString("yyyy-MM-dd HH:mm:ss")
    } catch {
        return Clean-Text $Value
    }
}

function Get-SafeCim {
    param(
        [string]$ClassName,
        [string]$Namespace = "root/cimv2"
    )

    try {
        return Get-CimInstance -Namespace $Namespace -ClassName $ClassName -ErrorAction Stop
    } catch {
        return $null
    }
}

function Get-AdminStatus {
    try {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($identity)
        return $principal.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
    } catch {
        return $false
    }
}

function Normalize-Mac {
    param([string]$Mac)

    $text = Clean-Text $Mac
    if (-not $text) { return "" }

    $hex = ($text -replace "[^0-9A-Fa-f]", "").ToUpper()
    if ($hex.Length -eq 12) {
        return (($hex -split "(.{2})" | Where-Object { $_ }) -join ":")
    }

    return $text.Replace("-", ":").ToUpper()
}

function Infer-StorageType {
    param(
        [string]$MediaType,
        [string]$BusType,
        [string]$Model
    )

    $media = (Clean-Text $MediaType).ToUpper()
    $bus = (Clean-Text $BusType).ToUpper()
    $modelText = (Clean-Text $Model).ToUpper()

    if ($bus -match "NVME" -or $modelText -match "NVME") { return "SSD NVMe" }
    if ($media -match "SSD" -or $modelText -match "SSD") { return "SSD" }
    if ($media -match "HDD" -or $modelText -match "HDD") { return "HDD" }
    if ($modelText -match "EMMC") { return "eMMC" }

    return ""
}

function To-Base64Utf8 {
    param([string]$Text)

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    return [Convert]::ToBase64String($bytes)
}

function Get-DocumentsDirectory {
    param([string]$RequestedDirectory)

    if (-not [string]::IsNullOrWhiteSpace($RequestedDirectory)) {
        if (-not (Test-Path -LiteralPath $RequestedDirectory)) {
            New-Item -ItemType Directory -Path $RequestedDirectory -Force | Out-Null
        }
        return $RequestedDirectory
    }

    $documents = [Environment]::GetFolderPath("MyDocuments")
    if (-not $documents) {
        $documents = Join-Path $env:USERPROFILE "Documents"
    }

    if (-not (Test-Path -LiteralPath $documents)) {
        New-Item -ItemType Directory -Path $documents -Force | Out-Null
    }

    return $documents
}

function Get-InstalledRegistryApps {
    $apps = @()
    $paths = @(
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
    )

    foreach ($path in $paths) {
        try {
            $items = Get-ItemProperty -Path $path -ErrorAction Stop |
                Where-Object {
                    $_.DisplayName -and
                    $_.DisplayName -notmatch "Update|Hotfix|Security Update|Redistributable|Runtime|Driver|Language Pack"
                }

            foreach ($item in $items) {
                $name = Clean-Text $item.DisplayName
                $version = Clean-Text $item.DisplayVersion
                $publisher = Clean-Text $item.Publisher

                if ($name) {
                    $apps += [pscustomobject]@{
                        Name = $name
                        Version = $version
                        Publisher = $publisher
                    }
                }
            }
        } catch {}
    }

    return $apps | Sort-Object Name, Version -Unique
}

function Format-InstalledAppsSummary {
    param([array]$Apps)

    $summary = @()

    foreach ($app in ($Apps | Sort-Object Name, Version -Unique)) {
        if ($app.Version) {
            $summary += "$($app.Name) ($($app.Version))"
        } else {
            $summary += "$($app.Name)"
        }
    }

    return $summary
}

function Get-PrimaryDiskInfo {
    $result = [ordered]@{
        Model = ""
        SizeGB = ""
        MediaType = ""
        BusType = ""
        StorageText = ""
        StorageType = ""
        Firmware = ""
        Serial = ""
    }

    try {
        $disk = Get-PhysicalDisk | Sort-Object Size -Descending | Select-Object -First 1

        if ($disk) {
            $sizeGb = [math]::Round($disk.Size / 1GB, 2)

            $result.Model = Clean-Text $disk.FriendlyName
            $result.SizeGB = $sizeGb
            $result.MediaType = Clean-Text $disk.MediaType
            $result.BusType = Clean-Text $disk.BusType
            $result.Firmware = Clean-Text $disk.FirmwareVersion
            $result.Serial = Clean-Text $disk.SerialNumber
            $result.StorageText = "$sizeGb GB - $($result.Model)"
            $result.StorageType = Infer-StorageType -MediaType $result.MediaType -BusType $result.BusType -Model $result.Model

            return $result
        }
    } catch {}

    try {
        $disk2 = Get-SafeCim -ClassName "Win32_DiskDrive" | Sort-Object Size -Descending | Select-Object -First 1

        if ($disk2) {
            $sizeGb = [math]::Round($disk2.Size / 1GB, 2)

            $result.Model = Clean-Text $disk2.Model
            $result.SizeGB = $sizeGb
            $result.MediaType = Clean-Text $disk2.MediaType
            $result.BusType = Clean-Text $disk2.InterfaceType
            $result.Serial = Clean-Text $disk2.SerialNumber
            $result.StorageText = "$sizeGb GB - $($result.Model)"
            $result.StorageType = Infer-StorageType -MediaType $result.MediaType -BusType $result.BusType -Model $result.Model
        }
    } catch {}

    return $result
}

function Get-PrimaryNetworkInfo {
    $result = [ordered]@{
        AdapterName = ""
        MacAddress = ""
        IPAddress = ""
    }

    try {
        $adapter = Get-NetAdapter |
            Where-Object {
                $_.Status -eq "Up" -and
                $_.MacAddress -and
                $_.Name -notmatch "Loopback|Virtual|VMware|Hyper-V|Bluetooth|TAP|VPN"
            } |
            Sort-Object InterfaceMetric |
            Select-Object -First 1

        if (-not $adapter) {
            $adapter = Get-NetAdapter |
                Where-Object { $_.Status -eq "Up" -and $_.MacAddress } |
                Select-Object -First 1
        }

        if ($adapter) {
            $ip = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $adapter.InterfaceIndex |
                Where-Object { $_.IPAddress -notmatch "^169\.254\." } |
                Select-Object -First 1

            $result.AdapterName = Clean-Text $adapter.Name
            $result.MacAddress = Normalize-Mac $adapter.MacAddress
            $result.IPAddress = Clean-Text $ip.IPAddress
        }
    } catch {}

    return $result
}

function Get-SecurityCenterAvProducts {
    $products = @()

    try {
        $items = Get-SafeCim -Namespace "root/SecurityCenter2" -ClassName "AntivirusProduct"
        foreach ($item in $items) {
            $name = Clean-Text $item.displayName
            if ($name) {
                $products += [pscustomobject]@{
                    Name = $name
                    Source = "SecurityCenter2"
                    ProductState = Clean-Text $item.productState
                }
            }
        }
    } catch {}

    return $products
}

function Get-McAfeeTrellixServices {
    $services = @()

    try {
        $services = Get-Service |
            Where-Object {
                $_.Name -match "McAfee|Trellix|mfe|masvc|mfemms|mfefire" -or
                $_.DisplayName -match "McAfee|Trellix"
            } |
            Sort-Object DisplayName
    } catch {}

    return $services
}

function Get-WindowsDefenderInfo {
    $result = [ordered]@{
        Name = "Windows Defender"
        Enabled = ""
        Source = "Windows Defender"
    }

    try {
        $status = Get-MpComputerStatus
        if ($status) {
            $enabled = $status.AMServiceEnabled -or $status.AntivirusEnabled -or $status.RealTimeProtectionEnabled
            $result.Enabled = if ($enabled) { "SI" } else { "NO" }
            $result.Source = "Get-MpComputerStatus"
        }
    } catch {
        $result.Enabled = ""
    }

    return $result
}

function Get-ChromeBaseEmail {
    $chromeUserData = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"
    if (-not (Test-Path -LiteralPath $chromeUserData)) { return "" }

    $profileDirs = @()

    foreach ($profileName in @("Default", "Profile 1", "Profile 2", "Profile 3", "Profile 4", "Profile 5")) {
        $profilePath = Join-Path $chromeUserData $profileName
        if (Test-Path -LiteralPath $profilePath) {
            $profileDirs += $profilePath
        }
    }

    try {
        $extraProfiles = Get-ChildItem -LiteralPath $chromeUserData -Directory -ErrorAction Stop |
            Where-Object { $_.Name -match "^Profile \d+$" } |
            Select-Object -ExpandProperty FullName

        foreach ($profile in $extraProfiles) {
            if ($profileDirs -notcontains $profile) {
                $profileDirs += $profile
            }
        }
    } catch {}

    foreach ($profilePath in $profileDirs) {
        $preferencesPath = Join-Path $profilePath "Preferences"
        if (-not (Test-Path -LiteralPath $preferencesPath)) { continue }

        try {
            $raw = Get-Content -LiteralPath $preferencesPath -Raw -Encoding UTF8
            $json = $raw | ConvertFrom-Json

            if ($json.account_info -and $json.account_info.Count -gt 0) {
                foreach ($account in $json.account_info) {
                    $email = Clean-Text $account.email
                    if ($email -match "^[^@\s]+@[^@\s]+\.[^@\s]+$") { return $email }
                }
            }

            $candidates = @(
                $json.profile.user_name,
                $json.google.services.username,
                $json.sync.username
            )

            foreach ($candidate in $candidates) {
                $email = Clean-Text $candidate
                if ($email -match "^[^@\s]+@[^@\s]+\.[^@\s]+$") { return $email }
            }

            $regexMatch = [regex]::Match($raw, "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
            if ($regexMatch.Success) {
                return $regexMatch.Value
            }
        } catch {}
    }

    return ""
}

function Get-AntivirusInfo {
    param([array]$InstalledApps)

    $result = [ordered]@{
        HasAntivirus = "NO"
        Name = ""
        Source = ""
        Details = ""
    }

    $securityCenterProducts = Get-SecurityCenterAvProducts
    $mcAfeeSecurityCenter = $securityCenterProducts | Where-Object { $_.Name -match "McAfee|Trellix" } | Select-Object -First 1

    if ($mcAfeeSecurityCenter) {
        $result.HasAntivirus = "SI"
        $result.Name = $mcAfeeSecurityCenter.Name
        $result.Source = "SecurityCenter2"
        $result.Details = "Producto detectado en SecurityCenter2"
        return $result
    }

    $mcAfeeServices = Get-McAfeeTrellixServices
    if ($mcAfeeServices -and $mcAfeeServices.Count -gt 0) {
        $serviceNames = ($mcAfeeServices | Select-Object -First 5 | ForEach-Object { Clean-Text $_.DisplayName }) -join "; "
        $result.HasAntivirus = "SI"
        $result.Name = "McAfee/Trellix"
        $result.Source = "Servicios Windows"
        $result.Details = $serviceNames
        return $result
    }

    $mcAfeeApps = $InstalledApps |
        Where-Object { $_.Name -match "McAfee|Trellix" -or $_.Publisher -match "McAfee|Trellix" } |
        Select-Object -First 5

    if ($mcAfeeApps -and $mcAfeeApps.Count -gt 0) {
        $appNames = ($mcAfeeApps | ForEach-Object { Clean-Text $_.Name }) -join "; "
        $result.HasAntivirus = "SI"
        $result.Name = ($mcAfeeApps | Select-Object -First 1).Name
        $result.Source = "Registro Uninstall"
        $result.Details = $appNames
        return $result
    }

    $thirdPartyAv = $securityCenterProducts |
        Where-Object { $_.Name -notmatch "Windows Defender|Microsoft Defender" } |
        Select-Object -First 1

    if ($thirdPartyAv) {
        $result.HasAntivirus = "SI"
        $result.Name = $thirdPartyAv.Name
        $result.Source = "SecurityCenter2"
        $result.Details = "Producto antivirus tercero detectado"
        return $result
    }

    $defender = Get-WindowsDefenderInfo
    if ($defender.Enabled -eq "SI") {
        $result.HasAntivirus = "SI"
        $result.Name = $defender.Name
        $result.Source = $defender.Source
        $result.Details = "Proteccion Microsoft Defender activa"
        return $result
    }

    if ($securityCenterProducts -and $securityCenterProducts.Count -gt 0) {
        $fallback = $securityCenterProducts | Select-Object -First 1
        $result.HasAntivirus = "SI"
        $result.Name = $fallback.Name
        $result.Source = "SecurityCenter2"
        $result.Details = "Producto reportado por Windows"
        return $result
    }

    return $result
}

# ------------------------------------------------------------------------------
# INICIO
# ------------------------------------------------------------------------------

Clear-Host

Write-Host "======================================================"
Write-Host "TIC - AUDITOR DE ACTIVOS VS04.1"
Write-Host "======================================================"
Write-Host ""

$isAdmin = Get-AdminStatus

if (-not $isAdmin) {
    Write-Warning "Se recomienda ejecutar como administrador para mejorar la lectura de seriales y hardware."
}

$outDir = Get-DocumentsDirectory -RequestedDirectory $OutputDirectory

Write-Host "Carpeta de salida: $outDir"
Write-Host "Recolectando informacion del equipo..."
Write-Host ""

# ------------------------------------------------------------------------------
# RECOLECCION DE DATOS
# ------------------------------------------------------------------------------

$cpu = Get-SafeCim -ClassName "Win32_Processor" | Select-Object -First 1
$cs = Get-SafeCim -ClassName "Win32_ComputerSystem" | Select-Object -First 1
$bios = Get-SafeCim -ClassName "Win32_BIOS" | Select-Object -First 1
$board = Get-SafeCim -ClassName "Win32_BaseBoard" | Select-Object -First 1
$os = Get-SafeCim -ClassName "Win32_OperatingSystem" | Select-Object -First 1
$gpus = Get-SafeCim -ClassName "Win32_VideoController"
$memory = Get-SafeCim -ClassName "Win32_PhysicalMemory"
$battery = Get-SafeCim -ClassName "Win32_Battery" | Select-Object -First 1

$hostname = Clean-Text $env:COMPUTERNAME
$userName = Clean-Text $env:USERNAME
$manufacturer = Clean-Text $cs.Manufacturer
$model = Clean-Text $cs.Model

$serial = Clean-Text $bios.SerialNumber
if ($serial -match "O\.E\.M|Default|To Be Filled|System Serial Number") {
    $serial = ""
}

$cpuName = Clean-Text $cpu.Name
$cpuCores = Clean-Text $cpu.NumberOfCores
$cpuThreads = Clean-Text $cpu.NumberOfLogicalProcessors
$cpuMaxClockGHz = ""
if ($cpu.MaxClockSpeed) {
    $cpuMaxClockGHz = [math]::Round($cpu.MaxClockSpeed / 1000, 2)
}

$totalRamGb = ""
$ramText = ""
$ramDetails = @()

try {
    $totalRamBytes = ($memory | Measure-Object -Property Capacity -Sum).Sum
    if ($totalRamBytes) {
        $totalRamGb = [math]::Round($totalRamBytes / 1GB, 0)
    }

    $ramSpeed = ($memory | Select-Object -First 1).Speed

    if ($totalRamGb) {
        if ($ramSpeed) {
            $ramText = "$totalRamGb GB ($ramSpeed MHz)"
        } else {
            $ramText = "$totalRamGb GB"
        }
    }

    foreach ($stick in $memory) {
        $capacity = [math]::Round($stick.Capacity / 1GB, 0)
        $ramDetails += "Slot: $($stick.DeviceLocator) | Capacidad: $capacity GB | Velocidad: $($stick.Speed) MHz | Fabricante: $($stick.Manufacturer) | Parte: $($stick.PartNumber)"
    }
} catch {}

$gpuMain = ""
$gpuDetails = @()

try {
    $gpuMain = Clean-Text (($gpus | Select-Object -First 1).Name)

    foreach ($gpu in $gpus) {
        $vram = ""
        if ($gpu.AdapterRAM) {
            $vram = "$([math]::Round($gpu.AdapterRAM / 1GB, 2)) GB"
        }

        $gpuDetails += "GPU: $(Clean-Text $gpu.Name) | VRAM: $vram | Driver: $(Clean-Text $gpu.DriverVersion) | VideoProcessor: $(Clean-Text $gpu.VideoProcessor)"
    }
} catch {}

$disk = Get-PrimaryDiskInfo

$cUsedGb = ""
$cFreeGb = ""
try {
    $driveC = Get-PSDrive C
    $cUsedGb = [math]::Round($driveC.Used / 1GB, 2)
    $cFreeGb = [math]::Round($driveC.Free / 1GB, 2)
} catch {}

$network = Get-PrimaryNetworkInfo
$installedApps = Get-InstalledRegistryApps
$appsSummary = Format-InstalledAppsSummary -Apps $installedApps
$av = Get-AntivirusInfo -InstalledApps $installedApps
$chromeBaseEmail = Get-ChromeBaseEmail
$softwareOrEmail = if ($chromeBaseEmail) { $chromeBaseEmail } elseif ($av.Name) { $av.Name } else { "-" }

$osCaption = Clean-Text $os.Caption
$osVersion = Clean-Text $os.Version
$osBuild = Clean-Text $os.BuildNumber
$installDate = Format-DateTime $os.InstallDate
$windowsFolderDate = ""

try {
    $windowsFolderDate = Format-DateTime ((Get-Item "C:\Windows").CreationTime)
} catch {}

$lastBoot = Format-DateTime $os.LastBootUpTime
$uptimeText = ""
try {
    $uptime = (Get-Date) - $os.LastBootUpTime
    $uptimeText = "$($uptime.Days)d $($uptime.Hours)h $($uptime.Minutes)m"
} catch {}

$batteryMah = ""
try {
    if ($battery.DesignCapacity) {
        $batteryMah = Clean-Text $battery.DesignCapacity
    }
} catch {}

$bloatwareFlag = "NO"
$bloatwareFindings = @()
$bloatwarePaths = @(
    "C:\Program Files (x86)\Steam",
    "C:\Program Files\Steam",
    "C:\Riot Games",
    "C:\Program Files\Epic Games",
    "C:\Program Files (x86)\Epic Games"
)

foreach ($path in $bloatwarePaths) {
    if (Test-Path -LiteralPath $path) {
        $bloatwareFlag = "POSIBLE"
        $bloatwareFindings += $path
    }
}

# ------------------------------------------------------------------------------
# PAYLOAD COMPATIBLE CON GAS
# ------------------------------------------------------------------------------

$generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$fileSafeHostname = if ($hostname) { $hostname } else { "EQUIPO" }
$fileSafeUser = if ($userName) { $userName } else { "USUARIO" }
$fileName = "TIC - Registro de Inventario de Activos VS04.1 - $fileSafeHostname - $fileSafeUser - $stamp.txt"

$payload = [ordered]@{
    schema_version = $SchemaVersion
    generated_at = $generatedAt
    generated_by = $GeneratedBy

    empresa_grupo = ""
    estado_registro = "ACTIVO"
    tipo_activo = "PC-PORTÁTIL"

    marca = $manufacturer
    modelo = $model
    serie_service_tag = $serial
    imei_1 = ""
    imei_2 = ""

    direccion_mac = $network.MacAddress
    direccion_ip = $network.IPAddress
    numero_movil = ""
    operador = ""

    procesador = $cpuName
    memoria_ram_gb = $totalRamGb
    memoria_ram_texto = $ramText
    almacenamiento = $disk.StorageText
    tipo_almacenamiento = $disk.StorageType
    pantalla_pulgadas = ""
    tarjeta_video = $gpuMain

    sistema_operativo = $osCaption
    version_so = $osVersion
    os_build = $osBuild
    antivirus = $av.Name
    tiene_antivirus = $av.HasAntivirus
    antivirus_source = $av.Source
    antivirus_details = $av.Details
    bateria_mah = $batteryMah

    hostname = $hostname
    usuario_windows = $userName
    usuario_asignado = $userName
    dni_usuario = ""
    cargo_usuario = ""
    area_usuario = ""

    proyecto_sede = ""
    centro_de_costo = ""
    ubicacion_fisica = ""
    estado_operativo = "OPERATIVO"
    condicion = "BUENO"

    fecha_entrega = ""
    fecha_compra = ""
    proveedor_compra = ""
    numero_factura = ""
    costo_adquisicion_soles = ""
    garantia_fecha_fin = ""
    fecha_inicio_depreciacion = ""
    vida_util_meses = ""

    link_acta_entrega_f_tic_04 = ""
    link_checklist_f_tic_02 = ""
    link_checklist_f_tic_03 = ""
    link_factura_compra = ""
    link_informe_mtto_f_tic_11 = ""
    url_evidencia_foto = ""
    url_evidencia_adicional = ""

    caracteristica_especial = ""
    software_o_correo = $softwareOrEmail
    faltan_accesorios = ""
    observaciones = ""

    fecha_instalacion_windows = $installDate
    fecha_creacion_windows = $windowsFolderDate
    ultimo_arranque = $lastBoot
    uptime = $uptimeText

    board_manufacturer = Clean-Text $board.Manufacturer
    board_model = Clean-Text $board.Product
    board_version = Clean-Text $board.Version
    bios_version = Clean-Text $bios.SMBIOSBIOSVersion

    disk_model = $disk.Model
    disk_size_gb = $disk.SizeGB
    disk_media_type = $disk.MediaType
    disk_bus_type = $disk.BusType
    disk_firmware = $disk.Firmware
    disk_serial = $disk.Serial
    c_used_gb = $cUsedGb
    c_free_gb = $cFreeGb

    cpu_cores = $cpuCores
    cpu_threads = $cpuThreads
    cpu_max_clock_ghz = $cpuMaxClockGHz

    adapter_name = $network.AdapterName
    bloatware = $bloatwareFlag
    bloatware_findings = $bloatwareFindings

    nombre_archivo = $fileName
}

$jsonPayload = $payload | ConvertTo-Json -Depth 10 -Compress
$jsonB64 = To-Base64Utf8 -Text $jsonPayload

# TSV legacy de compatibilidad con versiones anteriores.
$legacyArray = @(
    $serial,
    $manufacturer,
    $model,
    $cpuName,
    $ramText,
    $gpuMain,
    $disk.Model,
    $disk.StorageText,
    "$cUsedGb GB",
    "$cFreeGb GB",
    $network.MacAddress,
    $network.IPAddress,
    $hostname,
    $userName,
    $osCaption,
    $osVersion,
    $fileName,
    $bloatwareFlag,
    $av.HasAntivirus,
    $av.Name,
    "",
    "",
    $installDate,
    $windowsFolderDate
)

$tsvPayload = $legacyArray -join "`t"
$tsvB64 = To-Base64Utf8 -Text $tsvPayload

$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($jsonPayload))
$hashSha256 = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })

# ------------------------------------------------------------------------------
# REPORTE TXT
# ------------------------------------------------------------------------------

$report = @"
======================================================
TIC - AUDITOR DE ACTIVOS VS04.1
======================================================

1. RESUMEN GENERAL
------------------------------------------------------
Equipo: $hostname
Usuario Windows: $userName
Fabricante: $manufacturer
Modelo: $model
Serie / Service Tag: $serial
Sistema operativo: $osCaption
Version SO: $osVersion
Build SO: $osBuild
Fecha de generacion: $generatedAt
Ejecutado como administrador: $isAdmin

2. PROCESADOR
------------------------------------------------------
Procesador: $cpuName
Nucleos: $cpuCores
Hilos: $cpuThreads
Frecuencia maxima GHz: $cpuMaxClockGHz

3. PLACA Y BIOS
------------------------------------------------------
Mainboard fabricante: $(Clean-Text $board.Manufacturer)
Mainboard modelo: $(Clean-Text $board.Product)
Mainboard version: $(Clean-Text $board.Version)
BIOS version: $(Clean-Text $bios.SMBIOSBIOSVersion)
BIOS serial: $serial

4. MEMORIA RAM
------------------------------------------------------
Memoria total: $ramText

Detalle de modulos:
$($ramDetails -join "`r`n")

5. VIDEO
------------------------------------------------------
Video principal: $gpuMain

Detalle de video:
$($gpuDetails -join "`r`n")

6. ALMACENAMIENTO
------------------------------------------------------
Disco principal: $($disk.Model)
Capacidad: $($disk.SizeGB) GB
Tipo detectado: $($disk.StorageType)
MediaType: $($disk.MediaType)
BusType: $($disk.BusType)
Firmware: $($disk.Firmware)
Serial disco: $($disk.Serial)

Particion C:
Usado: $cUsedGb GB
Libre: $cFreeGb GB

7. RED
------------------------------------------------------
Adaptador principal: $($network.AdapterName)
MAC: $($network.MacAddress)
IP: $($network.IPAddress)

8. SEGURIDAD
------------------------------------------------------
Tiene antivirus: $($av.HasAntivirus)
Antivirus: $($av.Name)
Fuente antivirus: $($av.Source)
Detalle antivirus: $($av.Details)
Correo base Chrome: $chromeBaseEmail
Bloatware heuristico: $bloatwareFlag

Hallazgos bloatware:
$($bloatwareFindings -join "`r`n")

9. WINDOWS
------------------------------------------------------
Fecha instalacion Windows: $installDate
Fecha creacion carpeta Windows: $windowsFolderDate
Ultimo arranque: $lastBoot
Uptime: $uptimeText

10. SOFTWARE INSTALADO
------------------------------------------------------
$($appsSummary -join "`r`n")

11. PAYLOAD PARA GAS
------------------------------------------------------
AUDIT_SCHEMA_VERSION=$SchemaVersion
AUDIT_HASH_SHA256=$hashSha256
AUDIT_PAYLOAD_JSON_B64=$jsonB64
AUDIT_PAYLOAD_TSV_B64=$tsvB64

======================================================
Fin del reporte
======================================================
"@

# ------------------------------------------------------------------------------
# GUARDADO
# ------------------------------------------------------------------------------

$outFile = Join-Path $outDir $fileName
$utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false
[System.IO.File]::WriteAllText($outFile, $report, $utf8NoBom)

Write-Host ""
Write-Host "======================================================"
Write-Host "AUDITORIA FINALIZADA"
Write-Host "======================================================"
Write-Host "Archivo generado:"
Write-Host $outFile
Write-Host ""
Write-Host "Este TXT ya puede cargarse en la WebApp GAS."
Write-Host ""

if ($OpenFolder) {
    Start-Process explorer.exe $outDir
}

Read-Host "Presiona Enter para salir"
