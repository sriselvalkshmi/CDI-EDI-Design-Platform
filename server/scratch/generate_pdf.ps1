$paths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)
$chromePath = ""
foreach ($p in $paths) {
    if (Test-Path $p) {
        $chromePath = $p
        break
    }
}
if ($chromePath -eq "") {
    throw "Chrome executable not found"
} else {
    Start-Process $chromePath -ArgumentList "--headless", "--disable-gpu", "--print-to-pdf=c:\Users\DELL\OneDrive\Attachments\CDI-EDI-Design-Platform\System_Modification_Report.pdf", "c:\Users\DELL\OneDrive\Attachments\CDI-EDI-Design-Platform\System_Modification_Report.html" -Wait
}
