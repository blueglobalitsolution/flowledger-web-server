$env:NODE_ENV = 'production'
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "node dist\server.cjs" -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
