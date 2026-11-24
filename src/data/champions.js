// LoL Esports Manager — Complete League of Legends Champion Roster (All 173 Champions up to 2026!)
// Compact tuple format expanded to full champion objects for speed & maintainability.
// Tuple: [id, name, roles, dmg, early, mid, late, engage, classTag, baseTier, color, counters]

const RAW_CHAMPS = [
  // A
  ['aatrox', 'Aatrox', ['TOP'], 'AD', 7, 9, 7, 7, 'Bruiser', 'A', '#c0392b', ['rumble', 'jayce', 'kennen']],
  ['ahri', 'Ahri', ['MID'], 'AP', 7, 9, 7, 7, 'Skirmish', 'A', '#ff7675', ['syndra', 'taliyah', 'leblanc']],
  ['akali', 'Akali', ['MID', 'TOP'], 'AP', 6, 9, 7, 6, 'Assassin', 'B', '#2ecc71', ['yone', 'azir', 'corki']],
  ['akshan', 'Akshan', ['MID', 'TOP'], 'AD', 9, 8, 6, 3, 'Skirmish', 'C', '#f59e0b', ['kassadin', 'veigar']],
  ['alistar', 'Alistar', ['SUP'], 'Tank', 7, 9, 8, 9, 'Tank', 'A', '#5b2c6f', ['leona', 'rakan', 'nautilus']],
  ['ambessa', 'Ambessa', ['TOP', 'JGL'], 'AD', 7, 9, 8, 8, 'Bruiser', 'S', '#a93226', ['ksante', 'jayce', 'gnar']],
  ['amumu', 'Amumu', ['JGL', 'SUP'], 'Tank', 6, 9, 8, 10, 'Teamfight', 'B', '#22c55e', ['viego', 'leesin']],
  ['anivia', 'Anivia', ['MID'], 'AP', 5, 8, 9, 5, 'Scaling', 'B', '#38bdf8', ['ryze', 'vladimir']],
  ['annie', 'Annie', ['MID', 'SUP'], 'AP', 7, 9, 7, 8, 'Teamfight', 'B', '#ef4444', ['ahri', 'yasuo']],
  ['aphelios', 'Aphelios', ['BOT'], 'AD', 6, 8, 10, 4, 'Hypercarry', 'B', '#5499c7', ['varus', 'ashe']],
  ['ashe', 'Ashe', ['BOT', 'SUP'], 'AD', 8, 8, 7, 9, 'Teamfight', 'S', '#5dade2', ['kalista', 'lucian', 'varus']],
  ['aurelionsol', 'Aurelion Sol', ['MID'], 'AP', 4, 7, 10, 6, 'Scaling', 'B', '#6366f1', ['orianna', 'viktor']],
  ['aurora', 'Aurora', ['MID', 'TOP'], 'AP', 7, 9, 8, 8, 'Teamfight', 'S', '#48dbfb', ['yone', 'akali', 'orianna']],
  ['azir', 'Azir', ['MID'], 'AP', 6, 8, 10, 8, 'Scaling', 'S', '#f1c40f', ['orianna', 'taliyah', 'corki']],
  // B
  ['bard', 'Bard', ['SUP'], 'AP', 7, 9, 8, 8, 'Skirmish', 'B', '#f5b041', ['braum', 'renata']],
  ['belveth', "Bel'Veth", ['JGL'], 'AD', 7, 9, 9, 6, 'Skirmish', 'B', '#a855f7', ['sejuani', 'maokai']],
  ['blitzcrank', 'Blitzcrank', ['SUP'], 'Tank', 8, 8, 6, 9, 'Skirmish', 'B', '#eab308', ['lulu', 'karma', 'yuumi']],
  ['brand', 'Brand', ['JGL', 'SUP', 'MID'], 'AP', 7, 9, 8, 4, 'Teamfight', 'A', '#ea580c', ['sejuani', 'ornn', 'sion']],
  ['braum', 'Braum', ['SUP'], 'Tank', 7, 8, 8, 6, 'Tank', 'A', '#3498db', ['nautilus', 'rell', 'alistar']],
  ['briar', 'Briar', ['JGL'], 'AD', 8, 8, 6, 8, 'Dive', 'C', '#e11d48', ['nidalee', 'graves']],
  // C
  ['caitlyn', 'Caitlyn', ['BOT'], 'AD', 9, 7, 9, 3, 'Poke', 'A', '#6366f1', ['kaisa', 'xayah', 'vayne']],
  ['camille', 'Camille', ['TOP'], 'AD', 6, 8, 9, 8, 'Split', 'B', '#5dade2', ['jayce', 'kennen', 'rumble']],
  ['cassiopeia', 'Cassiopeia', ['MID', 'TOP'], 'AP', 6, 8, 10, 6, 'Scaling', 'B', '#16a34a', ['ryze', 'sylas', 'ahri']],
  ['chogath', "Cho'Gath", ['TOP'], 'Tank', 6, 8, 9, 6, 'Tank', 'C', '#7e22ce', ['malphite', 'sion']],
  ['corki', 'Corki', ['MID', 'BOT'], 'AD', 8, 9, 7, 3, 'Poke', 'A', '#e67e22', ['orianna', 'syndra']],
  // D
  ['darius', 'Darius', ['TOP'], 'AD', 9, 8, 6, 4, 'Bruiser', 'C', '#991b1b', ['sion', 'ornn', 'ksante']],
  ['diana', 'Diana', ['JGL', 'MID'], 'AP', 6, 9, 7, 9, 'Dive', 'B', '#cbd5e1', ['nidalee', 'karthus']],
  ['draven', 'Draven', ['BOT'], 'AD', 10, 8, 6, 3, 'Skirmish', 'B', '#dc2626', ['kaisa', 'ezreal', 'jinx']],
  ['drmundo', 'Dr. Mundo', ['TOP'], 'Tank', 5, 8, 9, 4, 'Tank', 'C', '#7c3aed', ['malphite', 'kennen']],
  // E
  ['ekko', 'Ekko', ['JGL', 'MID'], 'AP', 6, 9, 8, 6, 'Assassin', 'B', '#38bdf8', ['syndra', 'viktor']],
  ['elise', 'Elise', ['JGL'], 'AP', 10, 7, 4, 7, 'Dive', 'B', '#dc2626', ['karthus', 'lillia']],
  ['evelynn', 'Evelynn', ['JGL'], 'AP', 5, 9, 8, 4, 'Assassin', 'C', '#ec4899', ['amumu', 'sejuani']],
  ['ezreal', 'Ezreal', ['BOT'], 'AD', 8, 9, 7, 2, 'Poke', 'A', '#f1c40f', ['ashe', 'varus', 'kalista']],
  // F
  ['fiddlesticks', 'Fiddlesticks', ['JGL'], 'AP', 6, 9, 8, 9, 'Teamfight', 'B', '#a16207', ['amumu', 'maokai']],
  ['fiora', 'Fiora', ['TOP'], 'AD', 7, 8, 9, 3, 'Split', 'B', '#c0392b', ['ksante', 'ornn', 'sion', 'aatrox']],
  ['fizz', 'Fizz', ['MID'], 'AP', 6, 9, 6, 7, 'Assassin', 'C', '#0284c7', ['syndra', 'lux', 'veigar']],
  // G
  ['galio', 'Galio', ['MID', 'SUP'], 'Tank', 7, 9, 8, 9, 'Teamfight', 'A', '#e2e8f0', ['akali', 'leblanc', 'sylas', 'ahri']],
  ['gangplank', 'Gangplank', ['TOP'], 'AD', 6, 8, 10, 4, 'Scaling', 'B', '#b45309', ['ornn', 'sion', 'ksante']],
  ['garen', 'Garen', ['TOP'], 'AD', 7, 8, 7, 4, 'Bruiser', 'C', '#2563eb', ['jax', 'riven']],
  ['gnar', 'Gnar', ['TOP'], 'AD', 7, 8, 8, 9, 'Teamfight', 'A', '#d35400', ['ksante', 'ornn', 'renekton']],
  ['gragas', 'Gragas', ['TOP', 'JGL', 'SUP'], 'AP', 7, 8, 8, 8, 'Teamfight', 'A', '#d35400', ['jax', 'aatrox', 'camille']],
  ['graves', 'Graves', ['JGL'], 'AD', 8, 8, 8, 3, 'Skirmish', 'B', '#92400e', ['nidalee', 'leesin', 'khazix']],
  ['gwen', 'Gwen', ['TOP'], 'AP', 6, 8, 10, 4, 'Split', 'A', '#38bdf8', ['ksante', 'ornn', 'sion', 'chogath']],
  // H
  ['hecarim', 'Hecarim', ['JGL'], 'AD', 7, 9, 7, 9, 'Dive', 'B', '#14b8a6', ['karthus', 'brand']],
  ['heimerdinger', 'Heimerdinger', ['SUP', 'TOP', 'MID'], 'AP', 9, 7, 6, 3, 'Poke', 'C', '#eab308', ['nautilus', 'leona']],
  ['hwei', 'Hwei', ['MID', 'SUP'], 'AP', 7, 9, 8, 6, 'Poke', 'A', '#38bdf8', ['orianna', 'azir', 'syndra']],
  // I
  ['illaoi', 'Illaoi', ['TOP'], 'AD', 8, 8, 6, 2, 'Split', 'C', '#15803d', ['ornn', 'sion', 'ksante']],
  ['irelia', 'Irelia', ['TOP', 'MID'], 'AD', 8, 9, 6, 7, 'Skirmish', 'B', '#ec4899', ['jayce', 'gnar', 'yone']],
  ['ivern', 'Ivern', ['JGL'], 'AP', 6, 9, 8, 5, 'Hypercarry', 'B', '#4ade80', ['sejuani', 'maokai']],
  // J
  ['janna', 'Janna', ['SUP'], 'AP', 7, 8, 9, 4, 'Hypercarry', 'B', '#bae6fd', ['rakan', 'leona', 'alistar']],
  ['jarvan', 'Jarvan IV', ['JGL'], 'AD', 8, 8, 6, 9, 'Dive', 'A', '#f1c40f', ['nidalee', 'viego']],
  ['jax', 'Jax', ['TOP', 'JGL'], 'AD', 6, 8, 9, 7, 'Split', 'A', '#8e44ad', ['camille', 'aatrox', 'ambessa']],
  ['jayce', 'Jayce', ['TOP', 'MID'], 'AD', 9, 8, 6, 3, 'Poke', 'A', '#2980b9', ['gnar', 'rumble', 'ornn']],
  ['jhin', 'Jhin', ['BOT'], 'AD', 8, 8, 8, 7, 'Poke', 'A', '#be123c', ['ezreal', 'kalista']],
  ['jinx', 'Jinx', ['BOT'], 'AD', 5, 8, 10, 3, 'Hypercarry', 'A', '#3498db', ['xayah', 'aphelios', 'ezreal']],
  // K
  ['kaisa', "Kai'Sa", ['BOT'], 'AD', 6, 9, 9, 5, 'Hypercarry', 'S', '#8e44ad', ['ezreal', 'smolder', 'aphelios']],
  ['kalista', 'Kalista', ['BOT'], 'AD', 10, 8, 5, 7, 'Dive', 'A', '#1abc9c', ['jinx', 'zeri', 'smolder']],
  ['karma', 'Karma', ['SUP', 'MID'], 'AP', 9, 8, 6, 4, 'Poke', 'A', '#10b981', ['braum', 'alistar']],
  ['karthus', 'Karthus', ['JGL'], 'AP', 5, 8, 10, 3, 'Scaling', 'B', '#0d9488', ['sejuani', 'amumu']],
  ['kassadin', 'Kassadin', ['MID'], 'AP', 3, 7, 10, 6, 'Scaling', 'C', '#6d28d9', ['azir', 'veigar', 'viktor']],
  ['katarina', 'Katarina', ['MID'], 'AP', 5, 9, 7, 5, 'Assassin', 'C', '#dc2626', ['veigar', 'lux']],
  ['kayle', 'Kayle', ['TOP'], 'AP', 3, 7, 10, 3, 'Scaling', 'C', '#facc15', ['ornn', 'sion']],
  ['kayn', 'Kayn', ['JGL'], 'AD', 5, 9, 8, 7, 'Skirmish', 'C', '#b91c1c', ['amumu', 'maokai']],
  ['kennen', 'Kennen', ['TOP'], 'AP', 7, 9, 8, 9, 'Teamfight', 'B', '#9b59b6', ['renekton', 'jax']],
  ['khazix', "Kha'Zix", ['JGL'], 'AD', 7, 9, 7, 4, 'Assassin', 'B', '#7c3aed', ['nidalee', 'karthus']],
  ['kindred', 'Kindred', ['JGL'], 'AD', 8, 9, 8, 4, 'Skirmish', 'A', '#e2e8f0', ['sejuani', 'maokai', 'vi']],
  ['kled', 'Kled', ['TOP'], 'AD', 9, 8, 5, 9, 'Dive', 'C', '#ea580c', ['aatrox', 'jayce']],
  ['kogmaw', "Kog'Maw", ['BOT'], 'AD', 5, 8, 10, 2, 'Hypercarry', 'B', '#a855f7', ['sivir', 'jinx']],
  ['ksante', "K'Sante", ['TOP'], 'Tank', 6, 8, 8, 8, 'Tank', 'S', '#c89b3c', ['aatrox', 'renekton', 'ornn']],
  // L
  ['leblanc', 'LeBlanc', ['MID'], 'AP', 9, 8, 5, 5, 'Assassin', 'B', '#9b59b6', ['azir', 'syndra', 'orianna']],
  ['leesin', 'Lee Sin', ['JGL'], 'AD', 9, 8, 5, 8, 'Skirmish', 'A', '#d35400', ['nidalee', 'viego', 'nocturne']],
  ['leona', 'Leona', ['SUP'], 'Tank', 8, 9, 7, 10, 'Tank', 'A', '#f1c40f', ['nautilus', 'lulu', 'rakan']],
  ['lillia', 'Lillia', ['JGL'], 'AP', 6, 9, 9, 7, 'Teamfight', 'A', '#ec4899', ['sejuani', 'maokai', 'skarner']],
  ['lissandra', 'Lissandra', ['MID'], 'AP', 7, 9, 7, 9, 'Teamfight', 'B', '#38bdf8', ['ahri', 'leblanc', 'akali']],
  ['locke', 'Locke', ['MID'], 'AP', 7, 9, 8, 6, 'Assassin', 'S', '#94a3b8', ['orianna', 'viktor', 'hwei']],
  ['lucian', 'Lucian', ['BOT', 'MID'], 'AD', 9, 8, 6, 4, 'Skirmish', 'A', '#ecf0f1', ['kaisa', 'jinx', 'aphelios']],
  ['lulu', 'Lulu', ['SUP'], 'AP', 7, 8, 9, 3, 'Hypercarry', 'B', '#af7ac5', ['braum', 'thresh']],
  ['lux', 'Lux', ['SUP', 'MID'], 'AP', 8, 8, 7, 5, 'Poke', 'B', '#fde047', ['janna', 'lulu']],
  // M
  ['malphite', 'Malphite', ['TOP'], 'Tank', 6, 9, 8, 10, 'Tank', 'B', '#64748b', ['jayce', 'jax', 'fiora', 'tryndamere']],
  ['malzahar', 'Malzahar', ['MID'], 'AP', 6, 8, 8, 7, 'Teamfight', 'C', '#7c3aed', ['akali', 'leblanc', 'yasuo']],
  ['maokai', 'Maokai', ['JGL', 'SUP', 'TOP'], 'Tank', 6, 9, 8, 9, 'Tank', 'A', '#16a085', ['vi', 'jarvan']],
  ['masteryi', 'Master Yi', ['JGL'], 'AD', 5, 8, 9, 2, 'Skirmish', 'C', '#eab308', ['karthus', 'lillia']],
  ['mel', 'Mel', ['MID', 'SUP'], 'AP', 7, 9, 9, 5, 'Poke', 'S', '#d4a84b', ['azir', 'orianna', 'corki']],
  ['milio', 'Milio', ['SUP'], 'AP', 6, 8, 9, 2, 'Hypercarry', 'B', '#eb984e', ['braum', 'renata']],
  ['missfortune', 'Miss Fortune', ['BOT'], 'AD', 8, 9, 7, 6, 'Teamfight', 'A', '#ef4444', ['ezreal', 'jhin']],
  ['mordekaiser', 'Mordekaiser', ['TOP'], 'AP', 7, 8, 7, 5, 'Bruiser', 'B', '#0f766e', ['ksante', 'ornn', 'malphite']],
  ['morgana', 'Morgana', ['SUP', 'JGL'], 'AP', 7, 8, 7, 6, 'Teamfight', 'B', '#6b21a8', ['nautilus', 'leona', 'blitzcrank']],
  // N
  ['naafiri', 'Naafiri', ['MID', 'JGL'], 'AD', 8, 8, 6, 6, 'Assassin', 'C', '#b91c1c', ['lux', 'xerath']],
  ['nami', 'Nami', ['SUP'], 'AP', 8, 8, 7, 7, 'Teamfight', 'A', '#06b6d4', ['braum', 'tahmkench']],
  ['nasus', 'Nasus', ['TOP'], 'AD', 4, 8, 9, 3, 'Split', 'C', '#ca8a04', ['malphite', 'sion']],
  ['nautilus', 'Nautilus', ['SUP'], 'Tank', 8, 8, 7, 10, 'Tank', 'S', '#2c3e50', ['lulu', 'milio', 'bard']],
  ['neeko', 'Neeko', ['MID', 'SUP'], 'AP', 8, 9, 7, 9, 'Teamfight', 'A', '#22c55e', ['ahri', 'leblanc']],
  ['nidalee', 'Nidalee', ['JGL'], 'AP', 9, 8, 5, 2, 'Poke', 'B', '#f39c12', ['maokai', 'sejuani', 'skarner']],
  ['nilah', 'Nilah', ['BOT'], 'AD', 5, 8, 9, 7, 'Skirmish', 'B', '#0ea5e9', ['samira', 'kaisa']],
  ['nocturne', 'Nocturne', ['JGL'], 'AD', 7, 9, 6, 9, 'Dive', 'B', '#34495e', ['nidalee', 'maokai']],
  ['nunu', 'Nunu & Willump', ['JGL'], 'Tank', 8, 8, 6, 8, 'Tank', 'C', '#38bdf8', ['karthus', 'viego']],
  // O
  ['olaf', 'Olaf', ['TOP', 'JGL'], 'AD', 9, 8, 5, 6, 'Bruiser', 'B', '#dc2626', ['mordekaiser', 'ksante', 'ornn']],
  ['orianna', 'Orianna', ['MID'], 'AP', 7, 9, 9, 8, 'Teamfight', 'S', '#7fb3d5', ['ahri', 'sylas', 'akali']],
  ['ornn', 'Ornn', ['TOP'], 'Tank', 5, 8, 9, 9, 'Tank', 'A', '#e74c3c', ['renekton', 'kennen']],
  // P
  ['pantheon', 'Pantheon', ['JGL', 'TOP', 'SUP'], 'AD', 9, 8, 5, 8, 'Dive', 'B', '#b45309', ['renekton', 'fiora']],
  ['poppy', 'Poppy', ['JGL', 'SUP', 'TOP'], 'Tank', 8, 8, 7, 7, 'Tank', 'A', '#5499c7', ['vi', 'leesin', 'jarvan', 'xinzhao', 'rakan']],
  ['pyke', 'Pyke', ['SUP'], 'AD', 9, 8, 5, 8, 'Assassin', 'B', '#0ea5e9', ['lulu', 'karma', 'yuumi']],
  // Q
  ['qiyana', 'Qiyana', ['MID', 'JGL'], 'AD', 7, 9, 7, 8, 'Assassin', 'B', '#10b981', ['syndra', 'viktor']],
  ['quinn', 'Quinn', ['TOP'], 'AD', 9, 8, 6, 4, 'Split', 'C', '#6366f1', ['renekton', 'darius']],
  // R
  ['rakan', 'Rakan', ['SUP'], 'Tank', 7, 9, 8, 9, 'Dive', 'S', '#e67e22', ['renata', 'bard', 'milio']],
  ['rammus', 'Rammus', ['JGL'], 'Tank', 6, 8, 8, 8, 'Tank', 'C', '#ca8a04', ['masteryi', 'belveth', 'viego']],
  ['reksai', "Rek'Sai", ['JGL', 'TOP'], 'AD', 9, 8, 5, 7, 'Dive', 'B', '#7c3aed', ['nidalee', 'khazix']],
  ['rell', 'Rell', ['SUP', 'JGL'], 'Tank', 7, 9, 8, 10, 'Tank', 'S', '#f39c12', ['leona', 'nautilus', 'lulu']],
  ['renata', 'Renata Glasc', ['SUP'], 'AP', 7, 8, 9, 6, 'Teamfight', 'A', '#8e44ad', ['rell', 'nautilus', 'leona', 'alistar']],
  ['renekton', 'Renekton', ['TOP'], 'AD', 9, 8, 5, 7, 'Bruiser', 'A', '#27ae60', ['jax', 'camille', 'ambessa', 'riven']],
  ['rengar', 'Rengar', ['JGL', 'TOP'], 'AD', 8, 9, 6, 6, 'Assassin', 'C', '#92400e', ['nidalee', 'karthus']],
  ['riven', 'Riven', ['TOP'], 'AD', 8, 9, 7, 6, 'Skirmish', 'B', '#10b981', ['yasuo', 'yone', 'camille']],
  ['rumble', 'Rumble', ['TOP', 'MID'], 'AP', 8, 9, 7, 8, 'Teamfight', 'S', '#e67e22', ['ksante', 'gnar', 'ornn']],
  ['ryze', 'Ryze', ['MID'], 'AP', 6, 8, 9, 6, 'Scaling', 'B', '#2563eb', ['akali', 'sylas', 'ahri']],
  // S
  ['samira', 'Samira', ['BOT'], 'AD', 7, 9, 7, 6, 'Skirmish', 'B', '#b91c1c', ['ezreal', 'jhin']],
  ['sejuani', 'Sejuani', ['JGL'], 'Tank', 7, 8, 8, 9, 'Tank', 'A', '#3498db', ['leesin', 'xinzhao']],
  ['senna', 'Senna', ['SUP', 'BOT'], 'AD', 7, 8, 10, 4, 'Scaling', 'A', '#14b8a6', ['braum', 'tahmkench']],
  ['seraphine', 'Seraphine', ['SUP', 'BOT', 'MID'], 'AP', 6, 9, 9, 8, 'Teamfight', 'B', '#ec4899', ['janna', 'lulu']],
  ['sett', 'Sett', ['TOP', 'SUP'], 'AD', 8, 8, 7, 8, 'Bruiser', 'B', '#e11d48', ['ornn', 'sion', 'ksante']],
  ['shaco', 'Shaco', ['JGL', 'SUP'], 'AD', 9, 7, 5, 4, 'Assassin', 'C', '#dc2626', ['karthus', 'lillia']],
  ['shen', 'Shen', ['TOP', 'SUP'], 'Tank', 8, 8, 7, 7, 'Tank', 'B', '#1d4ed8', ['jax', 'camille']],
  ['shyvana', 'Shyvana', ['JGL'], 'AP', 5, 8, 8, 5, 'Poke', 'C', '#991b1b', ['sejuani', 'amumu']],
  ['singed', 'Singed', ['TOP'], 'AP', 6, 8, 8, 6, 'Split', 'C', '#22c55e', ['jax', 'irelia']],
  ['sion', 'Sion', ['TOP'], 'Tank', 6, 8, 8, 8, 'Tank', 'B', '#7f8c8d', ['jayce', 'kennen']],
  ['sivir', 'Sivir', ['BOT'], 'AD', 6, 8, 9, 6, 'Hypercarry', 'B', '#eab308', ['ashe', 'varus', 'caitlyn']],
  ['skarner', 'Skarner', ['JGL', 'TOP'], 'Tank', 7, 9, 8, 9, 'Tank', 'S', '#7f8c8d', ['vi', 'xinzhao', 'jarvan']],
  ['smolder', 'Smolder', ['BOT', 'MID'], 'AD', 4, 7, 10, 3, 'Scaling', 'B', '#e74c3c', ['jinx', 'aphelios']],
  ['sona', 'Sona', ['SUP'], 'AP', 5, 8, 10, 7, 'Scaling', 'C', '#38bdf8', ['janna', 'braum']],
  ['soraka', 'Soraka', ['SUP'], 'AP', 7, 8, 9, 2, 'Hypercarry', 'B', '#c084fc', ['braum', 'karma']],
  ['swain', 'Swain', ['MID', 'SUP', 'TOP'], 'AP', 6, 9, 8, 7, 'Teamfight', 'B', '#991b1b', ['galio', 'ryze']],
  ['sylas', 'Sylas', ['MID', 'TOP', 'JGL'], 'AP', 6, 9, 8, 8, 'Skirmish', 'A', '#6c5ce7', ['ahri', 'azir', 'aurora', 'malphite']],
  ['syndra', 'Syndra', ['MID'], 'AP', 8, 9, 8, 5, 'Teamfight', 'A', '#8e44ad', ['azir', 'aurora', 'taliyah']],
  // T
  ['tahmkench', 'Tahm Kench', ['SUP', 'TOP'], 'Tank', 7, 8, 8, 5, 'Tank', 'A', '#0f766e', ['nautilus', 'leona', 'blitzcrank']],
  ['taliyah', 'Taliyah', ['MID', 'JGL'], 'AP', 7, 9, 8, 7, 'Teamfight', 'A', '#d4ac0d', ['sylas', 'akali', 'leblanc', 'yone']],
  ['talon', 'Talon', ['MID', 'JGL'], 'AD', 9, 8, 5, 5, 'Assassin', 'C', '#475569', ['kassadin', 'veigar']],
  ['taric', 'Taric', ['SUP'], 'Tank', 6, 8, 9, 6, 'Teamfight', 'B', '#38bdf8', ['nautilus', 'leona', 'alistar']],
  ['teemo', 'Teemo', ['TOP'], 'AP', 8, 7, 6, 2, 'Poke', 'C', '#16a34a', ['garen', 'vayne']],
  ['thresh', 'Thresh', ['SUP'], 'Tank', 8, 8, 7, 8, 'Skirmish', 'A', '#1abc9c', ['leona', 'rakan', 'alistar']],
  ['tristana', 'Tristana', ['BOT', 'MID'], 'AD', 8, 8, 9, 5, 'Hypercarry', 'A', '#f97316', ['smolder', 'aphelios', 'azir']],
  ['trundle', 'Trundle', ['JGL', 'TOP'], 'AD', 8, 8, 7, 5, 'Bruiser', 'B', '#0284c7', ['sejuani', 'ornn', 'ksante', 'skarner']],
  ['tryndamere', 'Tryndamere', ['TOP'], 'AD', 7, 8, 8, 4, 'Split', 'C', '#b91c1c', ['kayle', 'gnar']],
  ['twistedfate', 'Twisted Fate', ['MID', 'TOP'], 'AP', 7, 9, 7, 8, 'Split', 'A', '#f59e0b', ['ahri', 'taliyah']],
  ['twitch', 'Twitch', ['BOT'], 'AD', 5, 8, 10, 4, 'Hypercarry', 'B', '#15803d', ['jinx', 'sivir']],
  // U
  ['udyr', 'Udyr', ['TOP', 'JGL'], 'Tank', 7, 8, 7, 6, 'Tank', 'B', '#16a085', ['rumble', 'gnar']],
  ['urgot', 'Urgot', ['TOP'], 'AD', 7, 9, 7, 6, 'Bruiser', 'B', '#0f766e', ['aatrox', 'renekton']],
  // V
  ['varus', 'Varus', ['BOT'], 'AD', 9, 8, 7, 7, 'Poke', 'S', '#9b59b6', ['kaisa', 'jinx', 'zeri']],
  ['vayne', 'Vayne', ['BOT', 'TOP'], 'AD', 5, 8, 10, 3, 'Hypercarry', 'B', '#4c1d95', ['ksante', 'ornn', 'sion']],
  ['veigar', 'Veigar', ['MID'], 'AP', 4, 8, 10, 6, 'Scaling', 'C', '#4338ca', ['azir', 'viktor']],
  ['velkoz', "Vel'Koz", ['SUP', 'MID'], 'AP', 7, 8, 8, 3, 'Poke', 'C', '#9333ea', ['orianna', 'viktor']],
  ['vex', 'Vex', ['MID'], 'AP', 7, 9, 7, 8, 'Teamfight', 'B', '#334155', ['ahri', 'leblanc', 'akali', 'sylas', 'yasuo']],
  ['vi', 'Vi', ['JGL'], 'AD', 8, 9, 6, 9, 'Dive', 'S', '#e84393', ['viego', 'nidalee', 'nocturne']],
  ['viego', 'Viego', ['JGL'], 'AD', 7, 9, 8, 6, 'Skirmish', 'S', '#1abc9c', ['sejuani', 'maokai', 'skarner']],
  ['viktor', 'Viktor', ['MID'], 'AP', 6, 8, 10, 4, 'Scaling', 'A', '#a855f7', ['taliyah', 'syndra', 'azir']],
  ['vladimir', 'Vladimir', ['MID', 'TOP'], 'AP', 4, 8, 10, 5, 'Scaling', 'B', '#991b1b', ['orianna', 'azir']],
  ['volibear', 'Volibear', ['TOP', 'JGL'], 'Tank', 9, 8, 5, 8, 'Dive', 'B', '#38bdf8', ['jax', 'irelia', 'camille']],
  // W
  ['warwick', 'Warwick', ['JGL', 'TOP'], 'AD', 9, 7, 5, 7, 'Bruiser', 'C', '#15803d', ['leesin', 'viego']],
  ['wukong', 'Wukong', ['JGL', 'TOP'], 'AD', 7, 9, 7, 9, 'Dive', 'A', '#e67e22', ['viego', 'nidalee', 'graves']],
  // X
  ['xayah', 'Xayah', ['BOT'], 'AD', 7, 8, 9, 4, 'Hypercarry', 'A', '#c0392b', ['kaisa', 'kalista', 'lucian']],
  ['xerath', 'Xerath', ['MID', 'SUP'], 'AP', 8, 8, 8, 2, 'Poke', 'C', '#0284c7', ['orianna', 'viktor']],
  ['xinzhao', 'Xin Zhao', ['JGL'], 'AD', 9, 8, 5, 8, 'Dive', 'A', '#2980b9', ['leesin', 'nidalee', 'vi']],
  // Y
  ['yasuo', 'Yasuo', ['MID', 'TOP', 'BOT'], 'AD', 7, 9, 8, 7, 'Skirmish', 'B', '#0284c7', ['gnar', 'syndra', 'lux']],
  ['yone', 'Yone', ['MID', 'TOP'], 'AD', 6, 9, 9, 8, 'Skirmish', 'S', '#e17055', ['syndra', 'orianna', 'corki']],
  ['yorick', 'Yorick', ['TOP'], 'AD', 6, 8, 8, 3, 'Split', 'C', '#0f766e', ['jayce', 'kennen']],
  ['yunara', 'Yunara', ['BOT'], 'AD', 6, 9, 10, 4, 'Hypercarry', 'S', '#06b6d4', ['varus', 'ashe', 'jinx']],
  ['yuumi', 'Yuumi', ['SUP'], 'AP', 4, 8, 9, 2, 'Hypercarry', 'C', '#a855f7', ['braum', 'tahmkench']],
  // Z
  ['zaahen', 'Zaahen', ['TOP', 'JGL'], 'AD', 7, 9, 8, 7, 'Skirmish', 'S', '#be123c', ['ksante', 'aatrox', 'ambessa']],
  ['zac', 'Zac', ['JGL', 'TOP'], 'Tank', 6, 9, 8, 10, 'Tank', 'A', '#22c55e', ['viego', 'nidalee']],
  ['zed', 'Zed', ['MID', 'JGL'], 'AD', 7, 9, 7, 4, 'Assassin', 'B', '#dc2626', ['syndra', 'veigar', 'viktor']],
  ['zeri', 'Zeri', ['BOT'], 'AD', 5, 8, 10, 4, 'Hypercarry', 'A', '#2ecc71', ['ezreal', 'xayah', 'ashe']],
  ['ziggs', 'Ziggs', ['BOT', 'MID'], 'AP', 8, 9, 7, 3, 'Poke', 'A', '#f97316', ['jinx', 'aphelios', 'smolder']],
  ['zilean', 'Zilean', ['SUP', 'MID'], 'AP', 5, 8, 9, 5, 'Scaling', 'B', '#38bdf8', ['vi', 'nocturne', 'zed']],
  ['zoe', 'Zoe', ['MID'], 'AP', 8, 9, 6, 3, 'Poke', 'B', '#ec4899', ['orianna', 'viktor', 'syndra']],
  ['zyra', 'Zyra', ['JGL', 'SUP'], 'AP', 8, 8, 7, 6, 'Poke', 'B', '#15803d', ['maokai', 'sejuani']],
];

export const CHAMPIONS = RAW_CHAMPS.map(([id, name, roles, dmg, early, mid, late, engage, classTag, baseTier, color, counters]) => ({
  id, name, roles, dmg, early, mid, late, engage, classTag, baseTier, color, counters: counters || [],
}));

export const CHAMPION_MAP = Object.fromEntries(CHAMPIONS.map(c => [c.id, c]));

export const PATCHES = [
  {
    version: '26.1',
    name: 'Erken Oyun & Ejder Baskısı',
    desc: 'Erken koridor hakimiyeti ve ilk iki ejderin altın/stat değeri artırıldı. Agresif ormancılar ve erken güçlü nişancılar öne çıkıyor.',
    buffedClasses: ['Dive', 'Skirmish', 'Bruiser'],
    nerfedClasses: ['Scaling'],
    earlyWeight: 1.18,
    midWeight: 1.0,
    lateWeight: 0.9,
  },
  {
    version: '26.2',
    name: 'Hypercarry & Geç Oyun Metası',
    desc: 'Kritik vuruş eşyaları güçlendirildi ve kule plakası altını azaltıldı. Geç oyunda parlayan nişancılar ve koruyucu destekler meta lideri.',
    buffedClasses: ['Hypercarry', 'Scaling'],
    nerfedClasses: ['Assassin', 'Dive'],
    earlyWeight: 0.9,
    midWeight: 1.0,
    lateWeight: 1.2,
  },
  {
    version: '26.3',
    name: 'Tank & Takım Savaşı Metası',
    desc: 'Ön saflardaki tank eşyaları ve alan hasarı büyücüleri güçlendi. Baron ve Ejder çevresindeki 5v5 savaşlar maçları belirliyor.',
    buffedClasses: ['Tank', 'Teamfight'],
    nerfedClasses: ['Poke', 'Split'],
    earlyWeight: 0.95,
    midWeight: 1.15,
    lateWeight: 1.05,
  },
  {
    version: '26.4',
    name: 'Suikastçı & Skirmish Kaosu',
    desc: 'Hiçlik Kurtçukları güçlendi, orta koridor suikastçıları ve bireysel mekanik odaklı şampiyonlar bufflandı.',
    buffedClasses: ['Assassin', 'Skirmish', 'Split'],
    nerfedClasses: ['Tank'],
    earlyWeight: 1.15,
    midWeight: 1.12,
    lateWeight: 0.88,
  },
  {
    version: '26.5',
    name: 'Worlds Dengeli Meta',
    desc: 'Uluslararası turnuva öncesi tüm sınıflar dengelendi. Takım sinerjisi, draft uyumu ve oyuncu şampiyon havuzu her zamankinden önemli.',
    buffedClasses: ['Teamfight', 'Hypercarry', 'Tank'],
    nerfedClasses: [],
    earlyWeight: 1.02,
    midWeight: 1.05,
    lateWeight: 1.05,
  },
];

export function getChampionMetaTier(champ, patch) {
  const tiers = ['C', 'B', 'A', 'S'];
  let idx = tiers.indexOf(champ.baseTier);
  if (patch.buffedClasses.includes(champ.classTag)) idx = Math.min(3, idx + 1);
  if (patch.nerfedClasses.includes(champ.classTag)) idx = Math.max(0, idx - 1);
  return tiers[idx];
}

export function getTierBonus(tier) {
  return tier === 'S' ? 4.5 : tier === 'A' ? 2.0 : tier === 'B' ? 0 : -2.5;
}

export function getMatchupAdvantage(champIdA, champIdB) {
  const a = CHAMPION_MAP[champIdA];
  const b = CHAMPION_MAP[champIdB];
  if (!a || !b) return 0;
  if (a.counters?.includes(b.id)) return 2.5;
  if (b.counters?.includes(a.id)) return -2.5;
  return 0;
}
