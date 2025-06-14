Write-Host "Instalando dependencias..." -ForegroundColor Green
pip install -r requirements.txt

Write-Host "Ativando ambiente virtual..." -ForegroundColor Green
.\.venv\Scripts\Activate.ps1

Write-Host "Gerando executavel..." -ForegroundColor Green
python build.py

Write-Host "Processo finalizado!" -ForegroundColor Green
Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 