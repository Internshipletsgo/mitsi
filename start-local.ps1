# Use the environment prepared during integration testing on this computer.
$projectPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$testedPython = 'C:\Users\Kremier\Documents\Codex\2026-09-09\referenced-chatgpt-conversation-this-is-an\work\venv\Scripts\python.exe'
if (Test-Path -LiteralPath $projectPython) {
    & $projectPython (Join-Path $PSScriptRoot 'backEND\api.py')
} elseif (Test-Path -LiteralPath $testedPython) {
    & $testedPython (Join-Path $PSScriptRoot 'backEND\api.py')
} else {
    throw 'Create the Python environment using the steps in README.md first.'
}
