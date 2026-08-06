$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$base = "https://d8j0ntlcm91z4.cloudfront.net/user_3CbkEBgw2ncADOZbGXU4H0akeB2"
$root = Split-Path $PSScriptRoot -Parent
$imgDir = Join-Path $root "public\images\services"
$vidDir = Join-Path $root "public\videos"
New-Item -ItemType Directory -Force $imgDir | Out-Null
New-Item -ItemType Directory -Force $vidDir | Out-Null

$images = @{
  "mali-danismanlik"                 = "hf_20260717_080632_475e91f1-0758-4642-a3fe-007a58df4fce.png"
  "yatirim-danismanligi"             = "hf_20260717_080633_bbc8141b-df2d-4434-a638-1b530b6f7e0a.png"
  "mali-ticari-hukuk-danismanligi"   = "hf_20260717_080635_c6cef7b5-c7f8-4bc9-bd94-4051ce302277.png"
  "ticaret-is-gelistirme"            = "hf_20260717_080636_068c4c6c-8e9a-4530-a1ae-c7f80565bbb2.png"
  "pazar-arastirmasi-pazara-giris"   = "hf_20260717_080638_0d701eb4-9aa5-403b-b691-e97baa77d832.png"
  "sirket-kurulusu"                  = "hf_20260717_081025_ede8dc68-6d8a-44c5-b49d-557be3ba2219.png"
  "kurumsal-kimlik-marka"            = "hf_20260717_080648_745b9bd8-aead-4ab4-a80f-39c686078f5f.png"
  "proje-yonetimi"                   = "hf_20260717_080650_d49c6fbe-f59b-4d0e-a0ce-58dbf843a7e8.png"
  "uyum-denetim-danismanligi"        = "hf_20260717_080651_eb5cb78b-427a-44be-bbcb-fdc1754161e3.png"
  "gayrimenkul-danismanligi"         = "hf_20260717_081027_5e4666bf-39c1-4123-a654-6a77a9c64b7e.png"
  "oturma-calisma-izni-vatandaslik"  = "hf_20260717_081030_c247a4b5-0220-42ee-932b-122870bb1948.png"
  "lojistik-gumruk-danismanligi"     = "hf_20260717_081031_9b95ae57-8425-4f1b-a82b-5b1759019ffb.png"
  "cozum-ortakliklari"               = "hf_20260717_080656_770fe5dd-82cd-4ed2-ba95-32867fc2a7f2.png"
}

$videos = @{
  "hero-journey" = "hf_20260717_080606_8d2e6cc3-5dc1-4f5a-b03c-74756a07a90e.mp4"
  "hero-skyline" = "hf_20260717_080608_e88a2412-7a73-490f-b9b8-07c31f56d6fd.mp4"
  "hero-compass" = "hf_20260717_080609_3482d8ae-fd27-4bb8-9293-cb396a163e4d.mp4"
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

$tmp = Join-Path $env:TEMP "safari_asset.png"

foreach ($slug in $images.Keys) {
  $url = "$base/$($images[$slug])"
  Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
  Save-Jpeg $tmp (Join-Path $imgDir "$slug.jpg") 1280
  Write-Host "image: $slug.jpg"
}

# about image goes one level up
Invoke-WebRequest -Uri "$base/hf_20260717_080657_936a3b8e-6797-4c0a-ad9e-ccaef84ee1b2.png" -OutFile $tmp -UseBasicParsing
Save-Jpeg $tmp (Join-Path $root "public\images\about.jpg") 1600
Write-Host "image: about.jpg"

foreach ($name in $videos.Keys) {
  $url = "$base/$($videos[$name])"
  Invoke-WebRequest -Uri $url -OutFile (Join-Path $vidDir "$name.mp4") -UseBasicParsing
  Write-Host "video: $name.mp4"
}

Remove-Item $tmp -ErrorAction SilentlyContinue
Write-Host "done"
