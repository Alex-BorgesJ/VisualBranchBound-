import PyInstaller.__main__
import os
import sys

# Obtém o diretório atual
current_dir = os.path.dirname(os.path.abspath(__file__))

# Lista de dependências necessárias
hidden_imports = [
    'flask',
    'numpy',
    'json',
    'os',
    'webbrowser',
    'tsp_solver'
]

PyInstaller.__main__.run([
    'app.py',
    '--name=VisualBranchBound',
    '--onefile',
    '--windowed',
    '--add-data=templates;templates',
    '--add-data=static;static',
    '--hidden-import=' + ' --hidden-import='.join(hidden_imports),
    '--collect-all=flask',
    '--collect-all=numpy',
    '--clean',
    '--noconfirm'
]) 