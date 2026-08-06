$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dir = Join-Path $root "public\images\references"
New-Item -ItemType Directory -Force $dir | Out-Null

$targets = @(
  @{ file = "turk-telekom";     titles = @("File:Türk Telekom logo.svg", "File:Turk Telekom logo.svg", "File:Türk Telekom 2023 logo.svg") },
  @{ file = "turkcell";         titles = @("File:Turkcell logo.svg", "File:Turkcell Logo.svg", "File:Turkcell-logo.svg") },
  @{ file = "vestel";           titles = @("File:Vestel logo.svg", "File:Vestel Logo.svg", "File:Vestel logo.png") },
  @{ file = "turkish-airlines"; titles = @("File:Turkish Airlines logo 2019 compact.svg", "File:Turkish Airlines logo.svg", "File:THY logo.svg") },
  @{ file = "altinbas";         titles = @("File:Altınbaş Holding logo.png", "File:Altinbas Holding logo.svg", "File:Altınbaş logo.svg") }
)

foreach ($t in $targets) {
  $saved = $false
  foreach ($title in $t.titles) {
    if ($saved) { break }
    try {
      $api = "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=" + [uri]::EscapeDataString($title)
      $resp = Invoke-RestMethod -Uri $api -UseBasicParsing
      $pages = $resp.query.pages.PSObject.Properties.Value
      foreach ($p in $pages) {
        if ($p.imageinfo -and $p.imageinfo[0].url) {
          $url = $p.imageinfo[0].url
          $ext = [System.IO.Path]::GetExtension($url).ToLower()
          if ($ext -notin @(".svg", ".png")) { continue }
          $out = Join-Path $dir ($t.file + $ext)
          Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -Headers @{ "User-Agent" = "SafariConsultingSite/1.0 (contact: bugranuri@gmail.com)" }
          $size = (Get-Item $out).Length
          Write-Host "OK  $($t.file)$ext  <= $title  ($size bytes)"
          $saved = $true
          break
        }
      }
    } catch {
      Write-Host "ERR $title : $($_.Exception.Message)"
    }
  }
  if (-not $saved) { Write-Host "MISS $($t.file)" }
}
