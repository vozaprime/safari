$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$base = "https://d8j0ntlcm91z4.cloudfront.net/user_3CbkEBgw2ncADOZbGXU4H0akeB2"
$root = Split-Path $PSScriptRoot -Parent
$dir = Join-Path $root "public\images\heroes"
New-Item -ItemType Directory -Force $dir | Out-Null

$map = @{
  "services"   = "hf_20260724_072717_17a0cf35-f4f0-4b9e-a550-a04cfbf169f4.png"
  "references" = "hf_20260724_072719_a2608969-87b0-476d-b763-9f057f43582e.png"
  "contact"    = "hf_20260724_072720_697dbd9e-ef3e-40a5-9217-cb4488afc3c5.png"
}

function Save-Jpeg([string]$pngPath, [string]$jpgPath, [int]$targetWidth) {
  $src = [System.Drawing.Image]::FromFile($pngPath)
  try {
    $w = [Math]::Min($targetWidth, $src.Width)
    $h = [int]([Math]::Round($src.Height * ($w / $src.Width)))
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.DrawImage($src, 0, 0, $w, $h)
    $gfx.Dispose()
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)
    $bmp.Save($jpgPath, $codec, $params)
    $bmp.Dispose()
  } finally {
    $src.Dispose()
  }
}

$tmp = Join-Path $env:TEMP "safari_hero.png"
foreach ($name in $map.Keys) {
  Invoke-WebRequest -Uri "$base/$($map[$name])" -OutFile $tmp -UseBasicParsing
  Save-Jpeg $tmp (Join-Path $dir "$name.jpg") 1920
  Write-Host "hero: $name.jpg"
}

# about header reuses the existing boardroom image
Copy-Item (Join-Path $root "public\images\about.jpg") (Join-Path $dir "about.jpg") -Force
Write-Host "hero: about.jpg (reused)"

Remove-Item $tmp -ErrorAction SilentlyContinue
Write-Host "done"
