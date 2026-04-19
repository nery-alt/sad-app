#!/bin/bash

# Função para compactar um arquivo
compact_file() {
  local file=$1
  sed -i 's/py-4/py-2/g' "$file"
  sed -i 's/px-4/px-3/g' "$file"
  sed -i 's/text-base/text-sm/g' "$file"
  sed -i 's/text-lg/text-sm/g' "$file"
  sed -i 's/text-4xl/text-2xl/g' "$file"
  sed -i 's/size={40}/size={20}/g' "$file"
  sed -i 's/size={24}/size={18}/g' "$file"
  sed -i 's/p-6/p-4/g' "$file"
  sed -i 's/p-8/p-6/g' "$file"
  sed -i 's/py-1/py-0.5/g' "$file"
  echo "✓ Compactado: $file"
}

# Compactar todos os componentes
for file in Protocolos.tsx DocumentosRecebidos.tsx DocumentosGerados.tsx Tarefas.tsx Agenda.tsx Dashboard.tsx; do
  if [ -f "$file" ]; then
    compact_file "$file"
  fi
done

echo "✓ Compactação concluída!"
