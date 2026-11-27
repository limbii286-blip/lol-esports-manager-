export interface PlayerDecisionOption {
  id: string;
  label: string;
  kind: 'AGGRO' | 'ROAM' | 'SAFE' | 'OBJECTIVE';
  attr: 'mechanics' | 'laning' | 'macro' | 'teamfight' | 'clutch';
  baseProb: number;
}

export interface PlayerDecisionContext {
  minute: number;
  role: string;
  myChamp: string;
  oppName: string;
  oppChamp: string;
  oppTag: string;
  myTag: string;
  goldDiff: number;
}

interface ScenarioTemplate {
  id: string;
  phase: 'EARLY' | 'MID' | 'LATE';
  roles?: ('TOP' | 'JGL' | 'MID' | 'BOT' | 'SUP')[];
  title: string;
  buildDesc: (ctx: PlayerDecisionContext) => string;
  options: PlayerDecisionOption[];
}

const SCENARIO_POOL: ScenarioTemplate[] = [
  // ==================== EARLY GAME (20 SCENARIOS) ====================
  {
    id: 'e1', phase: 'EARLY', title: 'Seviye 2 Öncelik Yarışı',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) ilk dalgayı hızlı itip Seviye 2'ye senden önce ulaşmaya çalışıyor.`,
    options: [
      { id: 'e1_a', label: 'Minyonlara vurup Seviye 2 takasına zorla', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'e1_b', label: 'Dalganın kule önüne gelmesini bekle & freeze kur', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'e1_c', label: 'Nehir çalısına erken totem atıp ormancıyı koru', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
      { id: 'e1_d', label: 'Ormancına nehir yengeci (Scuttle) için sinyalle', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
    ],
  },
  {
    id: 'e2', phase: 'EARLY', title: 'Yengeç (Scuttle) Çatışması',
    buildDesc: (c) => `Üst nehirde yengeç çıktı! ${c.oppTag} ormancısı ile senin ormancın karşılaşmak üzere; ${c.oppName} (${c.oppChamp}) harekete geçti.`,
    options: [
      { id: 'e2_a', label: 'Dalganı bırakıp hemen nehir savaşına koş', kind: 'ROAM', attr: 'macro', baseProb: 0.64 },
      { id: 'e2_b', label: '{oppName} yolunu kesip 1v1 düelloya çek', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.59 },
      { id: 'e2_c', label: 'Önce dalgayı kuleye vur, sonra geç destek ver', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
      { id: 'e2_d', label: 'Karşı nehir girişini totemleyip pusu kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.70 },
    ],
  },
  {
    id: 'e3', phase: 'EARLY', title: 'Sıçra (Flash) Olmayan Rakip',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) az önce Sıçra büyüsünü harcadı ve koridorun ortasında tek başına duruyor.`,
    options: [
      { id: 'e3_a', label: 'Tek başına Flash + Tüm kombonla üzerine atıl', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.63 },
      { id: 'e3_b', label: 'Ormancını çağırıp garanti gank ile skor al', kind: 'ROAM', attr: 'macro', baseProb: 0.72 },
      { id: 'e3_c', label: 'Dalgayı dondurup rakibi XP menzilinden at', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'e3_d', label: 'Baskıyı kurup rakip ormana derin görüş bırak', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
    ],
  },
  {
    id: 'e4', phase: 'EARLY', title: 'Kule Altı Baskı & Dive Riski',
    buildDesc: (c) => `${c.oppTag} ekibi büyük bir minyon dalgasıyla kule altına yaklaşıyor. ${c.oppName} (${c.oppChamp}) dive hazırlığında olabilir.`,
    options: [
      { id: 'e4_a', label: 'Kule altında outplay deneyip skor çevir', kind: 'AGGRO', attr: 'clutch', baseProb: 0.54 },
      { id: 'e4_b', label: 'Dalgayı hızla temizle ve güvenli geri çekil', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'e4_c', label: 'Ormancıdan counter-gank için pusuya yatmasını iste', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'e4_d', label: 'Arka çalıya kontrol totemi koyup açıyı boz', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
    ],
  },
  {
    id: 'e5', phase: 'EARLY', title: 'Erken Base Zamanlaması (Cheater Recall)',
    buildDesc: (c) => `3. dalgayı ${c.oppName} (${c.oppChamp}) kulesine itmeyi başardın. Üstünde 550 altın var.`,
    options: [
      { id: 'e5_a', label: 'Hemen base at, eşya farkıyla koridora dön', kind: 'SAFE', attr: 'laning', baseProb: 0.90 },
      { id: 'e5_b', label: 'Kal ve kule altındaki rakibi dürtüp plaka zorla', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.58 },
      { id: 'e5_c', label: '{oppTag} ormanına girip kamplarını kontrol et', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.68 },
      { id: 'e5_d', label: 'Orta/Alt koridora görünmeden erken baskın at', kind: 'ROAM', attr: 'macro', baseProb: 0.63 },
    ],
  },
  {
    id: 'e6', phase: 'EARLY', title: 'Hiçlik Kurtçukları (Voidgrubs) Çağrısı',
    buildDesc: (c) => `6. dakikada Hiçlik Kurtçukları doğdu. ${c.oppTag} üst tarafta toplanmaya başladı, ${c.oppName} (${c.oppChamp}) rotasyon yapıyor.`,
    options: [
      { id: 'e6_a', label: 'Hemen kurtçuk çukuruna inip takım savaşı başlat', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.66 },
      { id: 'e6_b', label: '{oppName} geçiş yolunda yakalayıp tek başına kes', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.57 },
      { id: 'e6_c', label: 'Koridorda kalıp tek başına ilk kule plakasını al', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
      { id: 'e6_d', label: 'Alt koridora çapraz baskın atıp dengeyi boz', kind: 'ROAM', attr: 'macro', baseProb: 0.64 },
    ],
  },
  {
    id: 'e7', phase: 'EARLY', title: 'Seviye 6 Güç Patlaması',
    buildDesc: (c) => `${c.myChamp} ile ultini açtın! ${c.oppName} (${c.oppChamp}) hâlâ Seviye 5 ve canı %65 civarında.`,
    options: [
      { id: 'e7_a', label: 'Anında ulti kombosuyla solo kill zorla', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.65 },
      { id: 'e7_b', label: 'Ulti baskısıyla rakibi ittirip yan koridora uç', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'e7_c', label: 'Minyon üstünlüğünü koruyup garanti altın kas', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'e7_d', label: 'Ejder öncesi ultinle nehir görüşünü ele geçir', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.72 },
    ],
  },
  {
    id: 'e8', phase: 'EARLY', title: 'Rakip Ormancı Baskını',
    buildDesc: (c) => `${c.oppTag} ormancısı koridor çalısında belirdi! ${c.oppName} (${c.oppChamp}) üzerine koşuyor.`,
    options: [
      { id: 'e8_a', label: '2v1 mekanik şov deneyip birini beraberinde götür', kind: 'AGGRO', attr: 'clutch', baseProb: 0.50 },
      { id: 'e8_b', label: 'Sıçra harcamadan akıllı pozisyonla kuleye süzül', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
      { id: 'e8_c', label: 'Zaman kazanıp takımının karşı haritada skor almasını sağla', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.71 },
      { id: 'e8_d', label: 'Ormancınla 2v2 çevirip karşı skor ara', kind: 'ROAM', attr: 'teamfight', baseProb: 0.62 },
    ],
  },
  {
    id: 'e9', phase: 'EARLY', title: 'İlk Ejder Önceliği',
    buildDesc: (c) => `${c.oppTag} ilk Ejderi zorlamak istiyor. ${c.oppName} (${c.oppChamp}) alt nehre doğru süzüldü.`,
    options: [
      { id: 'e9_a', label: 'Ejder çukurunda ilk çarpışmayı başlat', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.66 },
      { id: 'e9_b', label: 'Yan koridoru ittirip kule plakası sök', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'e9_c', label: '{oppName} arkadan yakalayıp pusu kur', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'e9_d', label: 'Üst koridora TP / roam atıp çapraz skor çıkar', kind: 'ROAM', attr: 'macro', baseProb: 0.64 },
    ],
  },
  {
    id: 'e10', phase: 'EARLY', title: 'Minyon Dondurma (Freeze) İkilemi',
    buildDesc: (c) => `Dalga tam kule önünde durdu. ${c.oppName} (${c.oppChamp}) farm yapabilmek için tehlikeli bölgeye girmek zorunda.`,
    options: [
      { id: 'e10_a', label: 'Sabırla freeze tut ve rakibi aç bırak', kind: 'SAFE', attr: 'laning', baseProb: 0.90 },
      { id: 'e10_b', label: 'Yaklaştığı an ağır takasa girip canını erit', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.63 },
      { id: 'e10_c', label: 'Ormancını çağırıp kolay gank skorunu al', kind: 'ROAM', attr: 'macro', baseProb: 0.71 },
      { id: 'e10_d', label: 'Hızlıca ittirip nehirdeki kontrol totemini kır', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.75 },
    ],
  },
  {
    id: 'e11', phase: 'EARLY', title: 'Mana & Can Avantajı',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) manasını tüketti ama kule altında 2 plaka bırakmamak için base atmıyor.`,
    options: [
      { id: 'e11_a', label: 'Dalgayı sok ve kule altında bitirici komboyu dene', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.59 },
      { id: 'e11_b', label: 'Canını riske atmadan plaka vurup altın topla', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'e11_c', label: 'Bu boşlukta yan koridora sürpriz baskın at', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'e11_d', label: 'Rakip orman kampını çalmaya gir', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.69 },
    ],
  },
  {
    id: 'e12', phase: 'EARLY', title: 'Rakip Roam Alarmı',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) koridordan kayboldu! Muhtemelen ${c.myTag} yan koridoruna baskına gidiyor.`,
    options: [
      { id: 'e12_a', label: 'Takımını uyar ve peşinden counter-roam at', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
      { id: 'e12_b', label: 'Koridorda kalıp 2 kule plakası ve tam dalga al', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'e12_c', label: 'Dönüş yolundaki çalıya pusu kurup onu bekle', kind: 'AGGRO', attr: 'clutch', baseProb: 0.61 },
      { id: 'e12_d', label: 'Ters taraftaki objektif/görüşü kontrol et', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
    ],
  },
  {
    id: 'e13', phase: 'EARLY', title: 'İlk Kan Fırsatı',
    buildDesc: (c) => `Maçta henüz skor çıkmadı. ${c.oppName} (${c.oppChamp}) yeteneklerini minyonlara harcadı!`,
    options: [
      { id: 'e13_a', label: 'Tüm yeteneklerinle agresif girip İlk Kanı al', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.62 },
      { id: 'e13_b', label: 'Kısa takas yapıp koridor üstünlüğünü kilitle', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
      { id: 'e13_c', label: 'Baskıyı kurup ormancına invade alanı aç', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'e13_d', label: 'Çalı kontrolünü alıp rakip totemi temizle', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
    ],
  },
  {
    id: 'e14', phase: 'EARLY', title: 'Karşı Takım İstilası (Invade)',
    buildDesc: (c) => `${c.oppTag} güçlendirme (Buff) çalmak için ormanınıza sızdı. Yakındaki ilk müdahale senden bekleniyor.`,
    options: [
      { id: 'e14_a', label: 'En önde girip hasar takasını başlat', kind: 'AGGRO', attr: 'teamfight', baseProb: 0.61 },
      { id: 'e14_b', label: 'Ön cepheyi tutup takımına pozisyon kazandır', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.70 },
      { id: 'e14_c', label: 'Sinyal atıp koridordaki minyonları kaybetme', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'e14_d', label: 'Yan açıdan dolaşıp kaçış yollarını kapat', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
    ],
  },
  {
    id: 'e15', phase: 'EARLY', title: 'Yetenek Atışı (Skillshot) Düellosu',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) ile koridor ortasında burun buruna geldin. Her şey reflekslere bakıyor.`,
    options: [
      { id: 'e15_a', label: 'Kritik yeteneğini Flash ile dodgeleyip karşı saldırı yap', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'e15_b', label: 'Minyon arkasında kalıp güvenli dürtme oyna', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'e15_c', label: 'Geri adım atıp takım arkadaşının gelişini bekle', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
      { id: 'e15_d', label: 'Rakibi çalı görüşünden çıkarıp baskı kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.72 },
    ],
  },
  {
    id: 'e16', phase: 'EARLY', title: 'Top/Bot Işınlanma (TP) Penceresi',
    buildDesc: (c) => `Alt koridorda 3v3 kavga patladı! ${c.oppTag} oyuncuları fazla ileri çıkmış durumda.`,
    options: [
      { id: 'e16_a', label: 'Arkadaki minyona/toteme TP atıp savaşı çevir', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'e16_b', label: 'TP saklayıp kendi koridorunda kule plakasını erit', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'e16_c', label: '{oppName} TP atmaya çalışırsa kitle kontrolle boz', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.64 },
      { id: 'e16_d', label: 'Bu kaos sırasında karşı taraftaki kampı/görüşü al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
    ],
  },
  {
    id: 'e17', phase: 'EARLY', title: 'Yavaş İtme (Slow Push) Hazırlığı',
    buildDesc: (c) => `2.5 dalgalık dev bir minyon sürüsü biriktirdin. ${c.oppName} (${c.oppChamp}) kule altında sıkıştı.`,
    options: [
      { id: 'e17_a', label: 'Dev dalgayla beraber 2v1 kule altı dive dene', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.58 },
      { id: 'e17_b', label: 'Kuleye vurup plaka altınını garantiye al', kind: 'SAFE', attr: 'laning', baseProb: 0.90 },
      { id: 'e17_c', label: 'Bu geniş sürede haritada görünmez olup roam at', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'e17_d', label: 'Nehre inip objektif öncesi kontrol totemi yerleştir', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.76 },
    ],
  },
  {
    id: 'e18', phase: 'EARLY', title: 'İlk Eşya Güç Eşiği',
    buildDesc: (c) => `İlk büyük alt bileşenini aldın; ${c.oppName} (${c.oppChamp}) ise henüz base atamadı ve 900 altınla koridorda.`,
    options: [
      { id: 'e18_a', label: 'Eşya farkını hemen agresif 1v1 ile skora çevir', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.66 },
      { id: 'e18_b', label: 'Rakibi base atmaya zorlayıp 2 dalga yak', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
      { id: 'e18_c', label: 'Üstünlüğünü yan koridora taşıyıp kill çıkar', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
      { id: 'e18_d', label: 'Gücünle nehir kontrolünü tamamen ${c.myTag} lehine al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
    ],
  },
  {
    id: 'e19', phase: 'EARLY', title: 'Sıkışan Ormancıya Yardım',
    buildDesc: (c) => `Ormancın ${c.oppTag} kampında yakalandı ve kaçmaya çalışıyor; ${c.oppName} (${c.oppChamp}) da oraya koşuyor.`,
    options: [
      { id: 'e19_a', label: 'Anında yardıma koşup 2v2 çatışmaya gir', kind: 'ROAM', attr: 'teamfight', baseProb: 0.64 },
      { id: 'e19_b', label: 'Koridoru ittirip rakip orta koridorun geçişini kes', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'e19_c', label: 'Koridor ekonomisini bozmadan güvenli farm yap', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
      { id: 'e19_d', label: 'Çıkış yoluna totem/kontrol atıp ormancını kurtar', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.72 },
    ],
  },
  {
    id: 'e20', phase: 'EARLY', title: 'Kule Plakalarının Son Dakikası',
    buildDesc: (c) => `14. dakikaya girilirken kule plakaları düşmek üzere. ${c.oppName} (${c.oppChamp}) kule önünde son savunmayı yapıyor.`,
    options: [
      { id: 'e20_a', label: 'Son plaka için kule altında riskli skor dene', kind: 'AGGRO', attr: 'clutch', baseProb: 0.57 },
      { id: 'e20_b', label: 'Güvenli mesafeden son plaka vuruşunu alıp çekil', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'e20_c', label: 'Diğer koridordaki boş kuleye hızlı rotasyon yap', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'e20_d', label: 'Vadi Alameti (Herald) için takımını topla', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.70 },
    ],
  },

  // ==================== MID GAME (20 SCENARIOS) ====================
  {
    id: 'm1', phase: 'MID', title: 'Vadi Alameti (Rift Herald) Savaşı',
    buildDesc: (c) => `${c.oppTag} Vadi Alameti'ni başlattı! ${c.oppName} (${c.oppChamp}) çukurun kenarında bekliyor.`,
    options: [
      { id: 'm1_a', label: 'Takımla çukura girip savaşı başlat', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.65 },
      { id: 'm1_b', label: 'Yan koridordan tek başına kule yık', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'm1_c', label: '{oppName} üzerine yan açıdan atlayıp yok et', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'm1_d', label: 'Alamet sonrası orta koridor savunmasına geç', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
    ],
  },
  {
    id: 'm2', phase: 'MID', title: 'Ejder Öncesi Görüş Savaşı',
    buildDesc: (c) => `Ejderin doğmasına 30 saniye var. ${c.oppTag} nehirdeki tüm görüşü temizledi.`,
    options: [
      { id: 'm2_a', label: 'Takımla beraber nehir görüşünü geri al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.70 },
      { id: 'm2_b', label: 'Karanlık çalıda pusu kurup ilk geleni avla', kind: 'AGGRO', attr: 'clutch', baseProb: 0.59 },
      { id: 'm2_c', label: 'Orta dalgayı ittirip takımına öncelik kazandır', kind: 'ROAM', attr: 'macro', baseProb: 0.72 },
      { id: 'm2_d', label: 'Riske girmeyip yan koridordan altın farkını aç', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'm3', phase: 'MID', title: '1-3-1 Ayrık İttirme Baskısı',
    buildDesc: (c) => `Yan koridorda tek başına ilerliyorsun; haritada ${c.oppTag} oyuncularından ikisi görünmüyor.`,
    options: [
      { id: 'm3_a', label: 'Kuleye basmaya devam et, 1v2 gelirse outplay dene', kind: 'AGGRO', attr: 'clutch', baseProb: 0.55 },
      { id: 'm3_b', label: 'Dalgayı ittirip karanlığa çekil (Fog of War)', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'm3_c', label: 'Orta koridora hızlı rotasyon yapıp 5v3 yakala', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'm3_d', label: 'Rakip ormana derin totem atıp yerlerini tespit et', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
    ],
  },
  {
    id: 'm4', phase: 'MID', title: 'Orta Koridor 2. Kule Kuşatması',
    buildDesc: (c) => `${c.myTag} orta koridorda 2. kuleyi kuşatıyor. ${c.oppName} (${c.oppChamp}) dalgayı temizlemeye yaklaştı.`,
    options: [
      { id: 'm4_a', label: 'Kule menzilinden içeri dalıp ani engage başlat', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.58 },
      { id: 'm4_b', label: 'Sabırla kuleyi dürtüp canını erit', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.72 },
      { id: 'm4_c', label: 'Yan açıdan pusu kurup kaçanları avla', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'm4_d', label: 'Yan dalgayı toplayıp takımına tempo kazandır', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'm5', phase: 'MID', title: 'Ödül Altını (Shutdown) Avı',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) üzerinde 700 altınlık ödül var ve ormanda tek başına ilerliyor!`,
    options: [
      { id: 'm5_a', label: 'Tek başına pusuya yatıp 700g ödülü kap', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'm5_b', label: 'Takım arkadaşını çağırıp garanti yakalama yap', kind: 'ROAM', attr: 'macro', baseProb: 0.73 },
      { id: 'm5_c', label: 'Bu fırsattan yararlanıp ters taraftaki objektifi al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.71 },
      { id: 'm5_d', label: 'Tuzak olabilir — koridor farmına devam et', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'm6', phase: 'MID', title: '3. Ejder Kritik Kavşağı',
    buildDesc: (c) => `Ejder Ruhuna bir adım kaldı! ${c.oppTag} tüm ultileriyle ejdere yürümeye başladı.`,
    options: [
      { id: 'm6_a', label: 'Takım savaşında en önde pozisyon al & çarpış', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.66 },
      { id: 'm6_b', label: 'Arka safa sızıp rakip taşıyıcıyı teklemeye çalış', kind: 'AGGRO', attr: 'clutch', baseProb: 0.58 },
      { id: 'm6_c', label: 'Yan koridordan TP açısı kovala & flank at', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'm6_d', label: 'Savaş kaybedilirse diye ters kuleyi ittir', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
    ],
  },
  {
    id: 'm7', phase: 'MID', title: 'Rakip Orman İstilası',
    buildDesc: (c) => `${c.myTag} haritada öne geçti (${c.goldDiff >= 0 ? `+${c.goldDiff}g` : `${c.goldDiff}g`}). Rakip orman kampları boş duruyor.`,
    options: [
      { id: 'm7_a', label: 'Kamptaki rakip oyuncuyu avlamak için derin gir', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'm7_b', label: 'Ormanı totemle boğup görüş ağını kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.75 },
      { id: 'm7_c', label: 'Kampları temizleyip orta koridora rotasyon at', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
      { id: 'm7_d', label: 'Güvenli koridor dalgalarını kaçırma', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },
  {
    id: 'm8', phase: 'MID', title: '2. Eşya Güç Zirvesi',
    buildDesc: (c) => `${c.myChamp} ile 2 çekirdek eşyanı tamamladın! Şimdi takımının en güçlü dönemindesin.`,
    options: [
      { id: 'm8_a', label: 'Sürekli agresif savaşlar zorlayıp oyunu kır', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.64 },
      { id: 'm8_b', label: 'Takımı objektif etrafında toplayıp 5v5 yönet', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'm8_c', label: 'Yan koridordan hızla kule açıp haritayı büyüt', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'm8_d', label: 'Hata yapmadan 3. eşya için farm temposunu koru', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'm9', phase: 'MID', title: 'Çapraz Harita (Cross-Map) Kararı',
    buildDesc: (c) => `${c.oppTag} alt koridorda 4 kişi göründü. Üst tarafta ise boş kule ve Baron bölgesi var.`,
    options: [
      { id: 'm9_a', label: 'Üst koridorda hemen kule yıkıp cevap ver', kind: 'ROAM', attr: 'macro', baseProb: 0.74 },
      { id: 'm9_b', label: 'Alt koridora TP atıp 4v4 savunma savaşı ver', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.62 },
      { id: 'm9_c', label: 'Yalnız kalan ${c.oppName} üzerine atlayıp skor al', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'm9_d', label: 'Dalgaları temizleyip altın kaybını sıfırla', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },
  {
    id: 'm10', phase: 'MID', title: 'Baron Önü Pusu (Death Brush)',
    buildDesc: (c) => `20. dakikada Baron doğdu. ${c.oppTag} destek oyuncusu çalıya totem atmaya geliyor.`,
    options: [
      { id: 'm10_a', label: 'Anında yakalayıp sayı üstünlüğüyle Baron al', kind: 'AGGRO', attr: 'clutch', baseProb: 0.63 },
      { id: 'm10_b', label: 'Görüşü silip Baron çukurunu kontrol altına al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.72 },
      { id: 'm10_c', label: 'Alt koridordan ittirip ${c.oppTag} dikkatini dağıt', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'm10_d', label: 'Risk almadan kendi ormanından farm topla', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'm11', phase: 'MID', title: 'Geri Düşülen Haritada Plan',
    buildDesc: (c) => `${c.oppTag} orta oyunda baskıyı artırdı (${c.oppName} ${c.oppChamp} ile çok güçlü).`,
    options: [
      { id: 'm11_a', label: 'Sürpriz bir 5v2 yakalama (Pick) ile geri dön', kind: 'AGGRO', attr: 'clutch', baseProb: 0.56 },
      { id: 'm11_b', label: 'Üs önünde dalgaları kesip geç oyuna uzat', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'm11_c', label: 'Rakip kule peşindeyken ters objektifi çal/al', kind: 'ROAM', attr: 'macro', baseProb: 0.64 },
      { id: 'm11_d', label: 'Savunma görüşü kurup takımını organize et', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.69 },
    ],
  },
  {
    id: 'm12', phase: 'MID', title: 'Takım Arkadaşını Kurtarma',
    buildDesc: (c) => `Nişancın nehirde ${c.oppName} (${c.oppChamp}) tarafından yakalandı!`,
    options: [
      { id: 'm12_a', label: 'İçeri atlayıp dikkatleri üstüne çek & savaşı çevir', kind: 'AGGRO', attr: 'clutch', baseProb: 0.57 },
      { id: 'm12_b', label: 'Kalkan/kitle kontrolle koru (Peel) ve geri çekilin', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'm12_c', label: 'Yakalanan oyuncuyu bırakıp orta kuleye baskı yap', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'm12_d', label: 'Pozisyonunu bozma, güvenli farm ile farkı kapat', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'm13', phase: 'MID', title: 'Atakhan / Nehir Çarpışması',
    buildDesc: (c) => `Nehirde büyük bir 4v4 çıkmak üzere. Her iki takım da birbirini tartıyor.`,
    options: [
      { id: 'm13_a', label: 'İlk açılışı yapıp savaşı başlatan kişi ol', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'm13_b', label: 'Takım savaşında doğru hedefe odaklan & kite yap', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.70 },
      { id: 'm13_c', label: 'Yan açıdan dolaşıp rakibin kaçışını kes', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'm13_d', label: 'Dürterek can azalt, tam girmeden dalga temizle', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
    ],
  },
  {
    id: 'm14', phase: 'MID', title: 'Kule Altı Savunma Krizi',
    buildDesc: (c) => `${c.oppTag} Alamet/dalga ile orta 1. kuleyi yıktı ve iç kuleye yürüyor.`,
    options: [
      { id: 'm14_a', label: 'Arka safa atlayıp kuşatmayı dağıt', kind: 'AGGRO', attr: 'clutch', baseProb: 0.58 },
      { id: 'm14_b', label: 'Minyon dalgasını hızla eritip kuleyi koru', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'm14_c', label: 'Yan koridordan ittirerek onları geri çekilmeye zorla', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'm14_d', label: 'Takımını yan çalıda toplayıp kontra savaş kur', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.68 },
    ],
  },
  {
    id: 'm15', phase: 'MID', title: 'Önemli Eşya Bekleyişi',
    buildDesc: (c) => `Bir sonraki büyük eşyana sadece 350 altın kaldı, ama takımın Ejder için toplanıyor.`,
    options: [
      { id: 'm15_a', label: 'Hızlıca bir dalga + kamp kesip eşyayla savaşa yetiş', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
      { id: 'm15_b', label: 'Eşyayı beklemeden hemen takımla savaşa gir', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.64 },
      { id: 'm15_c', label: 'Eşya öncesi ${c.oppName} üzerinde sürpriz takas dene', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.59 },
      { id: 'm15_d', label: 'Haritadaki diğer kuleyi açıp 350 altını oradan al', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
    ],
  },
  {
    id: 'm16', phase: 'MID', title: 'Karanlık Haritada Rotasyon',
    buildDesc: (c) => `Destek oyuncunla birlikte haritanın karanlık bölgesinde ilerliyorsunuz; ${c.oppTag} her an çıkabilir.`,
    options: [
      { id: 'm16_a', label: 'Kontrol totemi + tarayıcı ile güvenli görüş aç', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
      { id: 'm16_b', label: 'İlk gördüğün rakibin üzerine refleksle atıl', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.59 },
      { id: 'm16_c', label: 'Risk almayıp koridor dalgalarına geri dön', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'm16_d', label: 'Yan koridora inip güvenli ikili baskın yap', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
    ],
  },
  {
    id: 'm17', phase: 'MID', title: 'İkili Düello (2v2) Fırsatı',
    buildDesc: (c) => `Ormancınla birlikte ${c.oppName} (${c.oppChamp}) ve ${c.oppTag} ormancısını nehirde kıstırdınız!`,
    options: [
      { id: 'm17_a', label: 'Mekanik kombonla odaklanıp ikisini de temizle', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.63 },
      { id: 'm17_b', label: 'Takım uyumunu koruyup objektife yönel', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'm17_c', label: 'Rakibi kovalarken yan koridora sark', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'm17_d', label: 'Sıçra harcatıp güvenli biçimde dalgana dön', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'm18', phase: 'MID', title: 'Rakip Taşıyıcıyı Kilitleme',
    buildDesc: (c) => `${c.oppTag} takımının ana hasar kaynağı Sıçra olmadan ön safa fazla yaklaştı.`,
    options: [
      { id: 'm18_a', label: 'Anında Flash + CC kombosuyla tek başına avla', kind: 'AGGRO', attr: 'clutch', baseProb: 0.62 },
      { id: 'm18_b', label: 'Takım arkadaşınla koordineli odaklan', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.72 },
      { id: 'm18_c', label: 'Baskıyla geri püskürtüp harita kontrolünü al', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'm18_d', label: 'Önce ön cepheyi eritip pozisyonunu koru', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'm19', phase: 'MID', title: 'İnhibitör Kulesi Baskısı',
    buildDesc: (c) => `Üst/Alt koridorda 3. kule (İnhibitör kulesi) önünde ${c.myTag} baskı kurdu.`,
    options: [
      { id: 'm19_a', label: 'Kule altında sert engage atıp oyunu aç', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.57 },
      { id: 'm19_b', label: 'Kuleyi düşürüp Baron bölgesine rotasyon ver', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
      { id: 'm19_c', label: 'Diğer koridor dalgasını da aynı anda içeri sok', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
      { id: 'm19_d', label: 'Sabırlı kuşatmayla hata yapmadan kuleyi al', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'm20', phase: 'MID', title: 'Baron Öncesi Dalga Yönetimi',
    buildDesc: (c) => `Baron savaşı öncesi koridor dalgalarını ayarlamak gerekiyor; ${c.oppName} (${c.oppChamp}) alt koridorda görünüyor.`,
    options: [
      { id: 'm20_a', label: 'Hemen Baron çukuruna çağrı yapıp sayı üstünlüğüyle başla', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.69 },
      { id: 'm20_b', label: 'Alt koridora inip ${c.oppName} ile 1v1 düello at', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'm20_c', label: 'Üç koridoru da ittirip Baron görüşünü kilitle', kind: 'ROAM', attr: 'macro', baseProb: 0.71 },
      { id: 'm20_d', label: 'Güvenli dalga alıp 5v5 için hazırlan', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },

  // ==================== LATE GAME (20 SCENARIOS) ====================
  {
    id: 'l1', phase: 'LATE', title: 'Baron 50/50 Smite Savaşı',
    buildDesc: (c) => `${c.myTag} Baron'u yarıladı ama ${c.oppTag} tüm takımla çukurun üstüne yürüyor!`,
    options: [
      { id: 'l1_a', label: 'Baron\'u bırakıp arkadaki ${c.oppTag} taşıyıcısına dön', kind: 'AGGRO', attr: 'clutch', baseProb: 0.60 },
      { id: 'l1_b', label: 'Çukur girişini tut (Zone) ve ormancına zaman kazandır', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.69 },
      { id: 'l1_c', label: 'Yan açıdan flank atıp rakip ormancıyı uzaklaştır', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'l1_d', label: 'Güvenli mesafeden hasar verip hayatta kal', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
    ],
  },
  {
    id: 'l2', phase: 'LATE', title: 'Ejder Ruhu (Dragon Soul) Finali',
    buildDesc: (c) => `Ejder Ruhu için kader anı! ${c.oppName} (${c.oppChamp}) ve tüm ${c.oppTag} takımı nehirde pozisyon aldı.`,
    options: [
      { id: 'l2_a', label: '5v5 savaşta arka safa Flash komboyla dal', kind: 'AGGRO', attr: 'clutch', baseProb: 0.59 },
      { id: 'l2_b', label: 'Ön-arka saf disiplinini koruyup takımını taşı', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.70 },
      { id: 'l2_c', label: 'Rakip üssüne TP / Backdoor baskısı tehdidi kur', kind: 'ROAM', attr: 'macro', baseProb: 0.63 },
      { id: 'l2_d', label: 'Uzun menzilden dürtüp hata yapmalarını bekle', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'l3', phase: 'LATE', title: 'Kadim Ejderha (Elder Dragon) Krizi',
    buildDesc: (c) => `Kadim Ejderha doğdu! Bu savaşı kazanan büyük ihtimalle maçı bitirecek.`,
    options: [
      { id: 'l3_a', label: 'Tüm gücünle en yüksek tehdit ${c.oppName} üzerine atıl', kind: 'AGGRO', attr: 'clutch', baseProb: 0.58 },
      { id: 'l3_b', label: 'Takımının taşıyıcılarını koru & savaş pozisyonunu yönet', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'l3_c', label: 'Yan koridordaki süper minyonlarla Nexus baskısı kur', kind: 'ROAM', attr: 'macro', baseProb: 0.64 },
      { id: 'l3_d', label: 'Çalı görüşünü kontrol edip temkinli oyna', kind: 'SAFE', attr: 'laning', baseProb: 0.83 },
    ],
  },
  {
    id: 'l4', phase: 'LATE', title: 'İnhibitör Açma & Kuşatma',
    buildDesc: (c) => `Baron güçlendirmesiyle ${c.oppTag} üssüne dayandınız. ${c.oppName} (${c.oppChamp}) dalgayı kesmeye çalışıyor.`,
    options: [
      { id: 'l4_a', label: 'Kule altında ani engage atıp üssü kır', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'l4_b', label: 'Baron minyonlarını koruyup inhibitörü sabırla düşür', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.74 },
      { id: 'l4_c', label: 'Diğer koridordaki boş inhibitöre hızlı rotasyon yap', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'l4_d', label: 'Canını riske atmadan kuleye vur ve geri çık', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'l5', phase: 'LATE', title: 'Backdoor Fırsatı!',
    buildDesc: (c) => `${c.oppTag} takımı haritanın diğer ucunda Baron'la meşgul! Rakip Nexus kulelerinden biri yarı canında.`,
    options: [
      { id: 'l5_a', label: 'Tek başına rakip üsse sızıp Nexus\'u bitirmeyi dene!', kind: 'ROAM', attr: 'clutch', baseProb: 0.60 },
      { id: 'l5_b', label: 'Takımına katılıp Baron çukurunda 5v5 savaş', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.68 },
      { id: 'l5_c', label: 'Geri dönmeye çalışan ${c.oppName} önünü kes', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'l5_d', label: 'İnhibitörü alıp güvenli biçimde geri çekil', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'l6', phase: 'LATE', title: '40+ Dakika Ölüm Zamanlayıcısı',
    buildDesc: (c) => `Geç oyunda tek bir hata 50 saniyelik ölüm demek. İki takım orta koridorda karşı karşıya.`,
    options: [
      { id: 'l6_a', label: 'Kahramanlık anı: Flash komboyla savaşı sen aç', kind: 'AGGRO', attr: 'clutch', baseProb: 0.57 },
      { id: 'l6_b', label: 'Kusursuz takım savaşı pozisyonuyla hata bekle', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.72 },
      { id: 'l6_c', label: 'Görüş dışı açıdan flank tehdidi oluştur', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'l6_d', label: 'Tamamen güvenli kalıp sadece dalgayı temizle', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },
  {
    id: 'l7', phase: 'LATE', title: 'Süper Minyon Üssü Savunması',
    buildDesc: (c) => `İnhibitörün düştü ve süper minyonlar Nexus kulelerine dayanıyor; ${c.oppTag} oyunu bitirmeye geliyor.`,
    options: [
      { id: 'l7_a', label: 'Nexus önünde son umut mekanik outplay yap', kind: 'AGGRO', attr: 'clutch', baseProb: 0.56 },
      { id: 'l7_b', label: 'Takımla kule önünde duvar örüp dalgaları erit', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'l7_c', label: 'Öne çıkan ${c.oppName} yakalayıp komboyla cezalandır', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.67 },
      { id: 'l7_d', label: 'Savaş uzarken karşı koridorda tempo yarat', kind: 'ROAM', attr: 'macro', baseProb: 0.62 },
    ],
  },
  {
    id: 'l8', phase: 'LATE', title: 'Baron Tuzağı (Bait)',
    buildDesc: (c) => `${c.myTag} Baron'u sahte başlatıp karanlıkta pusu kurdu. ${c.oppTag} kontrol etmeye yaklaşıyor.`,
    options: [
      { id: 'l8_a', label: 'İlk giren rakibin üzerine tüm hasarını boşalt', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.64 },
      { id: 'l8_b', label: 'Koordineli CC zinciriyle takım savaşını kilitle', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.73 },
      { id: 'l8_c', label: 'Arka taraftan dolaşıp kaçış yollarını kapat', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'l8_d', label: 'Baron\'u bitirmeye odaklanıp riski azalt', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
    ],
  },
  {
    id: 'l9', phase: 'LATE', title: 'Son Eşya (6. Slot) & İksir',
    buildDesc: (c) => `Tam eşya (Full Build) seviyesine ulaştın! ${c.oppName} (${c.oppChamp}) de tam eşyada.`,
    options: [
      { id: 'l9_a', label: 'Koruyucu Melek / Zhonya güveniyle öne atıl', kind: 'AGGRO', attr: 'clutch', baseProb: 0.61 },
      { id: 'l9_b', label: 'Takım savaşında en yüksek DPS/koruma katkısını ver', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.72 },
      { id: 'l9_c', label: 'Yan koridordan son kuleleri süpürüp baskı kur', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'l9_d', label: 'Ölmeden pozisyonunu koru ve savaşı uzat', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'l10', phase: 'LATE', title: 'Nexus Önü Son Savaş',
    buildDesc: (c) => `İki takım da final savaşına giriyor! Maçın kaderi önümüzdeki 10 saniyede belli olacak.`,
    options: [
      { id: 'l10_a', label: '{oppName} ({oppChamp}) ile birebir son düelloya gir', kind: 'AGGRO', attr: 'clutch', baseProb: 0.60 },
      { id: 'l10_b', label: 'Takım savaşını kusursuz yönetip Ace (5\'te 5) ara', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'l10_c', label: 'Yan açıdan sürpriz TP ile arkalarına düş', kind: 'ROAM', attr: 'macro', baseProb: 0.65 },
      { id: 'l10_d', label: 'Düşük riskli pozisyonda kalıp kule/Nexus vur', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'l11', phase: 'LATE', title: 'Taraf Değişimi & Görüş Savaşı',
    buildDesc: (c) => `Harita tamamen karanlıklaştı. ${c.oppTag} Baron ile Ejder arasında şaşırtmaca yapıyor.`,
    options: [
      { id: 'l11_a', label: 'Mavi Ziynet / Totem ile karanlığı aydınlatıp kontrol kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.75 },
      { id: 'l11_b', label: 'Orman geçişinde tek yakaladığın rakibi kes', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.59 },
      { id: 'l11_c', label: 'Yan dalgayı ittirip rakibi göstermeye zorla', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'l11_d', label: 'Takımından ayrılma, 5 kişi beraber hareket et', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'l12', phase: 'LATE', title: 'Takım İçi Çağrı (Shotcall) Anı',
    buildDesc: (c) => `${c.oppTag} oyuncusu 2 kişi ölü! Takım arkadaşların ne yapılacağına karar veremiyor.`,
    options: [
      { id: 'l12_a', label: 'Doğrudan Nexus\'a koşup maçı bitirme çağrısı yap!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.62 },
      { id: 'l12_b', label: 'Garanti Baron / Kadim Ejderha aldırıp avantajı kilitle', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.76 },
      { id: 'l12_c', label: 'İki inhibitörü birden açıp haritayı tamamen ele geçir', kind: 'ROAM', attr: 'macro', baseProb: 0.71 },
      { id: 'l12_d', label: 'Base atıp eşya yenile & güvenli reset al', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
    ],
  },
  {
    id: 'l13', phase: 'LATE', title: 'Yalnız Kalan Rakip Split-Pusher',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) alt koridorda çok ileri çıktı; takımı Baron tarafında.`,
    options: [
      { id: 'l13_a', label: 'Hızlıca gidip 1v1 kes ve 5v4 Baron başlat', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.63 },
      { id: 'l13_b', label: 'Onu görmezden gelip Baron\'da 5v4 savaş zorla', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'l13_c', label: 'Koridoru tutup kuleyi vermeden TP sakla', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
      { id: 'l13_d', label: 'Takımla sıkıştırıp kaçışını engelle', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
    ],
  },
  {
    id: 'l14', phase: 'LATE', title: 'Kitle Kontrol Zinciri (Combo)',
    buildDesc: (c) => `Dar bir orman koridorunda ${c.oppTag} oyuncuları üst üste dizildi!`,
    options: [
      { id: 'l14_a', label: 'Alan etkili ultinle tüm takımı aynı anda vur', kind: 'AGGRO', attr: 'clutch', baseProb: 0.62 },
      { id: 'l14_b', label: 'Önce ön saftaki tankı eritip düzenli ilerle', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.72 },
      { id: 'l14_c', label: 'Dar koridoru kapatıp arkadaki taşıyıcıya yönel', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
      { id: 'l14_d', label: 'Mesafeni koruyup karşı engage yemeden çık', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'l15', phase: 'LATE', title: 'Süperstar Düellosu',
    buildDesc: (c) => `Tüm gözler seninle ${c.oppName} (${c.oppChamp}) arasındaki birebir kapışmada!`,
    options: [
      { id: 'l15_a', label: 'Mekanik sınırlarını zorlayıp birebirde ez', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'l15_b', label: 'Takım savaşında ondan daha fazla katkı sağla', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.72 },
      { id: 'l15_c', label: 'Harita rotasyonuyla onu macroda alt et', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
      { id: 'l15_d', label: 'Hata yapmasına izin ver, güvenli oyna', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'l16', phase: 'LATE', title: 'Baron Güçlendirmesiyle Ayrık Baskı',
    buildDesc: (c) => `${c.myTag} Baron güçlendirmesine sahip! Şimdi üsse girme zamanı.`,
    options: [
      { id: 'l16_a', label: '4-1 düzeninde yan koridordan tek başına kule sök', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'l16_b', label: '5 kişi orta koridordan sert kuşatma yap', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.73 },
      { id: 'l16_c', label: 'Kule altında agresif skor kovalayıp üssü dağıt', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.59 },
      { id: 'l16_d', label: 'Baron süresini boşa harcamadan 3 kule aç', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'l17', phase: 'LATE', title: 'Kritik Sıçra / Ulti Zamanlaması',
    buildDesc: (c) => `${c.oppTag} takımının en önemli ultileri bekleme süresinde (Cooldown)! Önünde 30 saniyelik altın fırsat var.`,
    options: [
      { id: 'l17_a', label: 'Hemen savaş çağrısı yap ve üstlerine koş', kind: 'AGGRO', attr: 'clutch', baseProb: 0.65 },
      { id: 'l17_b', label: 'Bu pencerede doğrudan objektife başla', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
      { id: 'l17_c', label: 'Yan koridor kulesini hızlıca yık', kind: 'ROAM', attr: 'macro', baseProb: 0.71 },
      { id: 'l17_d', label: 'Güvenli şekilde görüş ve altın farkını artır', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },
  {
    id: 'l18', phase: 'LATE', title: 'Rakip Üs Kuşatmasında Sabır Testi',
    buildDesc: (c) => `${c.oppTag} üssünden çıkmıyor ve dalga temizleyerek oyunu uzatmaya çalışıyor.`,
    options: [
      { id: 'l18_a', label: 'Zorla içeri dalıp savunmayı parçala', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.57 },
      { id: 'l18_b', label: 'Rakibi dışarı çekmek için Kadim/Baron\'a dön', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.75 },
      { id: 'l18_c', label: 'İki yan koridoru aynı anda ittirip savunmayı böl', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'l18_d', label: 'Sabırla dürtüp kule canını sıfırla', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'l19', phase: 'LATE', title: 'Son Çare Çalma (Steal) Girişimi',
    buildDesc: (c) => `${c.oppTag} büyük objektifi bitirmek üzere. Takımın biraz geride kaldı.`,
    options: [
      { id: 'l19_a', label: 'Çukura atlayıp hasarınla objektifi çalmayı dene!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.52 },
      { id: 'l19_b', label: 'Çukur dışından rakip taşıyıcıya odaklan', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.66 },
      { id: 'l19_c', label: 'Çalmak yerine orta koridorda kule/inhibitör takasla', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'l19_d', label: 'Hayatta kal ve üssü savunmak için geri çekil', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'l20', phase: 'LATE', title: 'Efsanevi Clutch Anı',
    buildDesc: (c) => `Takımının yarısı düştü, sadece sen ve bir arkadaşın ayaktasınız; ${c.oppName} (${c.oppChamp}) üzerinize geliyor!`,
    options: [
      { id: 'l20_a', label: 'Tüm mekaniklerini konuşturup 2v3 çevir!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.55 },
      { id: 'l20_b', label: 'Kule altında zaman kazanıp takımının doğmasını bekle', kind: 'SAFE', attr: 'laning', baseProb: 0.84 },
      { id: 'l20_c', label: 'Doğru hedefi kilitleyip en tehlikeli ismi düşür', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.66 },
      { id: 'l20_d', label: 'Dalgayı kesip rakibin oyunu bitirmesini engelle', kind: 'ROAM', attr: 'macro', baseProb: 0.71 },
    ],
  },

  // ==================== ROLE-SPECIFIC SCENARIOS (25: 5 PER ROLE) ====================
  // TOP
  {
    id: 'r_top1', phase: 'EARLY', roles: ['TOP'], title: 'Üst Koridor 1v1 Ada Savaşı',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) ile uzun üst koridorda tamamen baş başasın. Ormancılar alt tarafta.`,
    options: [
      { id: 'rt1_a', label: 'Mekanik sınırda uzun takasa girip solo kill ara', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'rt1_b', label: 'Dalgayı kule önünde dondurup rakibi aç bırak', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'rt1_c', label: 'Dalgayı itip Hiçlik Kurtçukları bölgesine toteme in', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
      { id: 'rt1_d', label: 'Alt koridora sürpriz TP açısı için çalı kontrolü kur', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
    ],
  },
  {
    id: 'r_top2', phase: 'EARLY', roles: ['TOP'], title: 'Weakside 1v2 Hayatta Kalma',
    buildDesc: (c) => `${c.oppTag} ormancısı üst koridora kamp kurdu; senin ormancın ise alt koridoru oynuyor.`,
    options: [
      { id: 'rt2_a', label: 'Kule altında sabırlı kal & XP kaçırmadan zaman kazan', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'rt2_b', label: 'Kule dibinde outplay deneyip 1v2 skor çevir', kind: 'AGGRO', attr: 'clutch', baseProb: 0.52 },
      { id: 'rt2_c', label: 'Arka çalıları totemleyip takımına Ejder alanı aç', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
      { id: 'rt2_d', label: 'Hızlıca orta koridora kayıp rakibi şaşırt', kind: 'ROAM', attr: 'macro', baseProb: 0.63 },
    ],
  },
  {
    id: 'r_top3', phase: 'MID', roles: ['TOP'], title: 'Proxy Dalga & Rakip Kamp Çalma',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) kule altına sıkıştı. Kule arkasından proxy dalga kesme fırsatın var.`,
    options: [
      { id: 'rt3_a', label: 'Proxy yapıp {oppTag} Gromp/Krug kampını çal', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
      { id: 'rt3_b', label: 'Kuleye odaklanıp 2. kuleyi doğrudan yık', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
      { id: 'rt3_c', label: 'Çalıda pusuya yatıp kuleye dönen {oppName} avla', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'rt3_d', label: 'Derin görüş atıp takımına Baron bölgesi güvenliği sağla', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.75 },
    ],
  },
  {
    id: 'r_top4', phase: 'MID', roles: ['TOP'], title: 'Yan Koridorda Çift Baskı (Split Push)',
    buildDesc: (c) => `TP hazır! Takımın Baron önünde oyalanırken sen alt koridorda ${c.oppName} karşısındasın.`,
    options: [
      { id: 'rt4_a', label: '{oppName} 1v1de ezip inhibitör kulesine dayan', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'rt4_b', label: 'Baron savaşının ortasına arkadan TP Flank at!', kind: 'ROAM', attr: 'teamfight', baseProb: 0.70 },
      { id: 'rt4_c', label: 'İki kişiyi üstüne çekip hasar almadan geri süzül', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
      { id: 'rt4_d', label: 'Haritayı açıp takımına ücretsiz Baron çağrısı yap', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
    ],
  },
  {
    id: 'r_top5', phase: 'LATE', roles: ['TOP'], title: 'Ön Saf (Frontline) / Flank Kararı',
    buildDesc: (c) => `Son takım savaşında ${c.oppTag} dizilişini kurdu. Takımının senden beklentisi büyük.`,
    options: [
      { id: 'rt5_a', label: 'Arka safa yan açıdan atlayıp taşıyıcıyı kilitle', kind: 'AGGRO', attr: 'clutch', baseProb: 0.60 },
      { id: 'rt5_b', label: 'Kendi taşıyıcının önünde duvar olup hasarı tankla', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.73 },
      { id: 'rt5_c', label: 'Yan koridor süper minyonlarıyla üssü zorla', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'rt5_d', label: 'Sabırlı pozisyon alıp karşı engage\'i boz', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },

  // JGL
  {
    id: 'r_jgl1', phase: 'EARLY', roles: ['JGL'], title: 'Seviye 3 İlk Baskın Rotası',
    buildDesc: (c) => `İlk orman temizliğini bitirdin! Üst koridor itilmiş, orta koridorda ise ${c.oppTag} oyuncusu Flash\'sız.`,
    options: [
      { id: 'rj1_a', label: 'Orta koridora Flash\'sız hedefe agresif gank at', kind: 'ROAM', attr: 'macro', baseProb: 0.71 },
      { id: 'rj1_b', label: '{oppName} ormanına girip ikinci buffını çal (Counter-Jungle)', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.62 },
      { id: 'rj1_c', label: 'Yengeçleri alıp tam temizlikle Seviye 4 garantile', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'rj1_d', label: 'Rakip orman girişine derin totem bırakıp rotayı çöz', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.76 },
    ],
  },
  {
    id: 'r_jgl2', phase: 'EARLY', roles: ['JGL'], title: 'Erken Ejder Sneak Fırsatı',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) üst tarafta göründü! Alt koridorun da önceliğe sahip.`,
    options: [
      { id: 'rj2_a', label: 'Tarayıcıyı açıp gizlice ilk Ejderi kes (Solo Sneak)', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.72 },
      { id: 'rj2_b', label: 'Alt koridora 3v2 kule altı dive çağrısı yap', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'rj2_c', label: '{oppTag} alt ormanındaki tüm kampları süpür', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rj2_d', label: 'Kendi kamplarını dönüp altın temposunu koru', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },
  {
    id: 'r_jgl3', phase: 'MID', roles: ['JGL'], title: 'Orman Hakimiyeti & Objektif Kontrolü',
    buildDesc: (c) => `Çarp (Smite) büyün hazır ve nehirde ${c.oppName} (${c.oppChamp}) ile karşı karşıyasın.`,
    options: [
      { id: 'rj3_a', label: 'Objektifi başlatıp Smite savaşında {oppName} alt et', kind: 'OBJECTIVE', attr: 'clutch', baseProb: 0.68 },
      { id: 'rj3_b', label: 'Önce {oppName} üzerine atlayıp ormancıyı saf dışı bırak', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'rj3_c', label: 'Yan koridoru gankleyip sayı üstünlüğüyle dön', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
      { id: 'rj3_d', label: 'Kontrol totemleriyle görüş kurup güvenli farm al', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'r_jgl4', phase: 'MID', roles: ['JGL'], title: 'Counter-Gank Sezgisi',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) büyük ihtimalle itilmiş olan alt koridoruna gank atmak üzere.`,
    options: [
      { id: 'rj4_a', label: 'Alt koridor çalısında pusuya yatıp 3v3 çevir!', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rj4_b', label: 'Üst tarafa ters baskın + Hiçlik Kurtçukları al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
      { id: 'rj4_c', label: 'Orman yolunda {oppName} tek yakalayıp kes', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.62 },
      { id: 'rj4_d', label: 'Sinyal atıp kendi kamplarında seviye öne geç', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'r_jgl5', phase: 'LATE', roles: ['JGL'], title: 'Baron / Kadim 50/50 Smite Anı',
    buildDesc: (c) => `Baron canı 1600\'e indi! ${c.oppName} (${c.oppChamp}) çukura atlamak için bekliyor.`,
    options: [
      { id: 'rj5_a', label: 'Soğukkanlı Smite zamanlamasıyla objektifi kilitle!', kind: 'OBJECTIVE', attr: 'clutch', baseProb: 0.69 },
      { id: 'rj5_b', label: 'Baron\'u bırakıp çukura giren {oppName} üzerine CC at', kind: 'AGGRO', attr: 'teamfight', baseProb: 0.62 },
      { id: 'rj5_c', label: 'Çukur dışından rakip taşıyıcıyı uzaklaştır', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
      { id: 'rj5_d', label: 'Takım hasarını bekleyip garanti bitiriş yap', kind: 'SAFE', attr: 'laning', baseProb: 0.82 },
    ],
  },

  // MID
  {
    id: 'r_mid1', phase: 'EARLY', roles: ['MID'], title: 'Orta Koridor Önceliği (Mid Prio)',
    buildDesc: (c) => `Ormancın nehirde savaşmak istiyor ama ${c.oppName} (${c.oppChamp}) seni orta koridorda tutmaya çalışıyor.`,
    options: [
      { id: 'rm1_a', label: 'Yeteneğinle dalgayı anında silip ilk rotasyonu yap', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rm1_b', label: '{oppName} ile agresif takasa girip canını %30\'a indir', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.62 },
      { id: 'rm1_c', label: 'Kule önünde güvenli dalga yönetimiyle CS kas', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'rm1_d', label: 'Kuşlar (Raptors) kampına totem atıp {oppTag} ormancısını izle', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.75 },
    ],
  },
  {
    id: 'r_mid2', phase: 'EARLY', roles: ['MID'], title: 'Alt Koridora Roam Penceresi',
    buildDesc: (c) => `Orta dalgayı ittirdin; ${c.oppTag} alt koridor ikilisi nehir totemini yeni kaybetti.`,
    options: [
      { id: 'rm2_a', label: 'Nehirden hızla inip alt koridora 4v2 baskın at!', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
      { id: 'rm2_b', label: 'Orta kuleye vurup plaka ve tam base zamanlaması al', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'rm2_c', label: 'Yolda karşılaşacağın {oppName} için çalıda tuzak kur', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.60 },
      { id: 'rm2_d', label: 'Ejder çukurunu tarayıp kontrol totemi yerleştir', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
    ],
  },
  {
    id: 'r_mid3', phase: 'MID', roles: ['MID'], title: 'Yan Koridor (Side Lane) Ataması',
    buildDesc: (c) => `Orta oyunda nişancın orta koridora geçti; şimdi sen yan koridorda dalga yöneteceksin.`,
    options: [
      { id: 'rm3_a', label: 'Yan koridorda {oppName} üzerine 1v1 baskısı kur', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'rm3_b', label: 'Dalgayı ittirip karanlıktan orta savaşına sark', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rm3_c', label: 'Güvenli biçimde 10 CS/dk temposunu koru', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'rm3_d', label: 'TP avantajınla objektif öncesi görüş kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.73 },
    ],
  },
  {
    id: 'r_mid4', phase: 'MID', roles: ['MID'], title: 'Suikast / Ani Hasar Penceresi',
    buildDesc: (c) => `${c.oppTag} taşıyıcısı orta koridorda yalnız başına dalga temizliyor.`,
    options: [
      { id: 'rm4_a', label: 'Karanlıktan çıkıp tek komboyla taşıyıcıyı sil!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.62 },
      { id: 'rm4_b', label: 'Ormancınla koordine olup kaçışsız yakala', kind: 'ROAM', attr: 'macro', baseProb: 0.72 },
      { id: 'rm4_c', label: 'Onu geri püskürtüp orta 2. kuleyi al', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.71 },
      { id: 'rm4_d', label: 'Tuzak ihtimaline karşı kendi dalgana dön', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
  {
    id: 'r_mid5', phase: 'LATE', roles: ['MID'], title: 'Takım Savaşı Bölge Kontrolü',
    buildDesc: (c) => `Geç oyunda takım savaşında hem yüksek hasar hem alan kontrolü senden bekleniyor.`,
    options: [
      { id: 'rm5_a', label: 'Ultini tüm {oppTag} arka safını vuracak şekilde at', kind: 'AGGRO', attr: 'clutch', baseProb: 0.60 },
      { id: 'rm5_b', label: 'Nişancınla yan yana durup girenleri erit', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.73 },
      { id: 'rm5_c', label: 'Yan açıdan TP ile rakip geri çekilme yolunu kes', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
      { id: 'rm5_d', label: 'Ölmeden sürekli dürtme (Poke) hasarı çıkar', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },

  // BOT
  {
    id: 'r_bot1', phase: 'EARLY', roles: ['BOT'], title: '2v2 Alt Koridor Güç Eşiği',
    buildDesc: (c) => `Destek oyuncunla Seviye 2/3 üstünlüğünü aldın; ${c.oppName} (${c.oppChamp}) son minyon için öne çıktı.`,
    options: [
      { id: 'rb1_a', label: 'Destekle aynı anda all-in girip 2v2 skor çıkar', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.63 },
      { id: 'rb1_b', label: 'Kusursuz son vuruşlarla (CS) altın farkını aç', kind: 'SAFE', attr: 'laning', baseProb: 0.90 },
      { id: 'rb1_c', label: 'Dalgayı itip ejder çukuruna görüş & baskı kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
      { id: 'rb1_d', label: 'Desteğini orta koridora roam için serbest bırak', kind: 'ROAM', attr: 'macro', baseProb: 0.68 },
    ],
  },
  {
    id: 'r_bot2', phase: 'EARLY', roles: ['BOT'], title: 'Kule Altı Baskı & Gank Korkusu',
    buildDesc: (c) => `Alt koridoru çok ittirdin ama ${c.oppTag} ormancısı uzun zamandır haritada görünmedi.`,
    options: [
      { id: 'rb2_a', label: 'Hemen dalgayı sıfırlayıp güvenli geri çekil', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'rb2_b', label: 'Gank gelirse kiting mekanikleriyle 2v3 çevir!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.54 },
      { id: 'rb2_c', label: 'Nehir çalısına kontrol totemi atıp baskıyı sürdür', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.72 },
      { id: 'rb2_d', label: 'Hızlı base atıp orta koridora şerit değişimi (Swap) yap', kind: 'ROAM', attr: 'macro', baseProb: 0.66 },
    ],
  },
  {
    id: 'r_bot3', phase: 'MID', roles: ['BOT'], title: 'Orta Koridora Geçiş (Mid Rotation)',
    buildDesc: (c) => `Alt 1. kule düştü! Şimdi nişancı-destek ikilisi olarak orta koridora yerleşme zamanı.`,
    options: [
      { id: 'rb3_a', label: 'Orta dalgaları hızla eritip Baron/Ejder önceliği al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.74 },
      { id: 'rb3_b', label: 'Orta koridorda agresif kuşatmayla kuleyi indir', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.62 },
      { id: 'rb3_c', label: 'Yan koridorlardaki güvenli büyük dalgaları topla', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
      { id: 'rb3_d', label: 'Takımla rakip ormana girip görüş hattını ileri taşı', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
    ],
  },
  {
    id: 'r_bot4', phase: 'MID', roles: ['BOT'], title: 'Suikastçı Baskısı Altında Kiting',
    buildDesc: (c) => `Takım savaşında ${c.oppTag} suikastçısı sürekli senin üzerine atlamayı bekliyor.`,
    options: [
      { id: 'rb4_a', label: 'Sıçra & pozisyonla suikastçıyı dodgelayıp erit!', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'rb4_b', label: 'Desteğinin dibinde kalıp en yakın hedefe vur (Front-to-Back)', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.75 },
      { id: 'rb4_c', label: 'Tehdit bitene kadar savaşın dışında güvenli bekle', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
      { id: 'rb4_d', label: 'Yan açıdan kule hasarıyla savaşı hızlandır', kind: 'ROAM', attr: 'macro', baseProb: 0.64 },
    ],
  },
  {
    id: 'r_bot5', phase: 'LATE', roles: ['BOT'], title: 'Geç Oyun Taşıyıcı Sorumluluğu',
    buildDesc: (c) => `38. dakikada takımının tüm hasarı senin elinde. Tek bir yanlış adım maçı kaybettirir.`,
    options: [
      { id: 'rb5_a', label: 'Öne çıkıp yüksek riskli agresif hasar patlaması yap', kind: 'AGGRO', attr: 'clutch', baseProb: 0.58 },
      { id: 'rb5_b', label: 'Mükemmel kite ile takım savaşında 100% hayatta kal', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.74 },
      { id: 'rb5_c', label: 'Baron sonrası Nexus kulelerini hızla erit', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rb5_d', label: 'Menzil sınırında sıfır riskle oyna', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },

  // SUP
  {
    id: 'r_sup1', phase: 'EARLY', roles: ['SUP'], title: 'Destek Roam Timing (Orta Baskın)',
    buildDesc: (c) => `Nişancın güvenli base attı; ${c.oppTag} orta koridoru ise ileri çıkmış durumda.`,
    options: [
      { id: 'rs1_a', label: 'Orta koridora gizlice yürüyüp skor çıkar!', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rs1_b', label: 'Rakip alt ormanı derin totemleyip tarayıcı ile temizle', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.77 },
      { id: 'rs1_c', label: 'Çalıda pusu kurup alt koridora dönen {oppName} yakala', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.61 },
      { id: 'rs1_d', label: 'Nişancının yanında kalıp kule altında XP topla', kind: 'SAFE', attr: 'laning', baseProb: 0.88 },
    ],
  },
  {
    id: 'r_sup2', phase: 'EARLY', roles: ['SUP'], title: 'Alt Koridor Çalı Hakimiyeti',
    buildDesc: (c) => `${c.oppName} (${c.oppChamp}) çalıları kontrol edip nişancına baskı kurmaya çalışıyor.`,
    options: [
      { id: 'rs2_a', label: 'Flash + Engage ile {oppName} veya nişancıyı kilitle', kind: 'AGGRO', attr: 'mechanics', baseProb: 0.62 },
      { id: 'rs2_b', label: 'Kontrol totemiyle çalı görüşünü tamamen al', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.76 },
      { id: 'rs2_c', label: 'Nişancını kalkan/iyileştirme ile koruyup farm yaptır', kind: 'SAFE', attr: 'laning', baseProb: 0.89 },
      { id: 'rs2_d', label: 'Ormancıyı çağırıp çalıdan sürpriz gank başlat', kind: 'ROAM', attr: 'macro', baseProb: 0.69 },
    ],
  },
  {
    id: 'r_sup3', phase: 'MID', roles: ['SUP'], title: 'Objektif Öncesi Görüş Kurulumu',
    buildDesc: (c) => `Ejder/Baron doğmasına 45 saniye var. Haritanın o bölgesi tamamen karanlık.`,
    options: [
      { id: 'rs3_a', label: '3 totem + tarayıcı ile tüm nehir görüşünü kur', kind: 'OBJECTIVE', attr: 'macro', baseProb: 0.76 },
      { id: 'rs3_b', label: 'Görüş atmaya gelen {oppName} yakalayıp savaş aç', kind: 'AGGRO', attr: 'clutch', baseProb: 0.61 },
      { id: 'rs3_c', label: 'Ormancınla birlikte rakip orman girişini kapat', kind: 'ROAM', attr: 'macro', baseProb: 0.70 },
      { id: 'rs3_d', label: 'Tek başına riske girme, nişancınla beraber yürü', kind: 'SAFE', attr: 'laning', baseProb: 0.87 },
    ],
  },
  {
    id: 'r_sup4', phase: 'MID', roles: ['SUP'], title: 'Engage mi, Peel (Koruma) mi?',
    buildDesc: (c) => `5v5 savaş başlamak üzere! Hem rakip taşıyıcı açıkta hem de senin taşıyıcın tehlikede.`,
    options: [
      { id: 'rs4_a', label: 'Nişancının yanında dur ve gelenleri durdur (Peel)', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.75 },
      { id: 'rs4_b', label: 'Rakip arka safa Flash Engage atıp savaşı kır!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.60 },
      { id: 'rs4_c', label: 'Yan açıdan rakibin kaçış/takviye yolunu kes', kind: 'ROAM', attr: 'macro', baseProb: 0.67 },
      { id: 'rs4_d', label: 'Takımını geri çekip daha iyi pozisyon aldır', kind: 'SAFE', attr: 'laning', baseProb: 0.85 },
    ],
  },
  {
    id: 'r_sup5', phase: 'LATE', roles: ['SUP'], title: 'Kader Belirleyen Pick / Hook Anı',
    buildDesc: (c) => `40. dakikada ${c.oppTag} oyuncusu Baron duvarının yanında yarım saniye açıkta kaldı!`,
    options: [
      { id: 'rs5_a', label: 'Refleksle tüm CC kombonu atıp maçı kazandıran picki yap!', kind: 'AGGRO', attr: 'clutch', baseProb: 0.62 },
      { id: 'rs5_b', label: 'Takım savaşında Mikael/Kefaret ile 5 kişiyi hayatta tut', kind: 'OBJECTIVE', attr: 'teamfight', baseProb: 0.74 },
      { id: 'rs5_c', label: 'Baron çukurundaki son rakip totemini temizle', kind: 'ROAM', attr: 'macro', baseProb: 0.72 },
      { id: 'rs5_d', label: 'Sabırlı kalıp hata yapmadan pozisyonu koru', kind: 'SAFE', attr: 'laning', baseProb: 0.86 },
    ],
  },
];

export const PLAYER_DECISION_POOL_SIZE = SCENARIO_POOL.length;

export function buildDynamicPlayerDecision(
  ctx: PlayerDecisionContext,
  usedIds: Set<string>
): { id: string; minute: number; title: string; desc: string; options: PlayerDecisionOption[] } {
  const phase: 'EARLY' | 'MID' | 'LATE' =
    ctx.minute <= 11 ? 'EARLY' : ctx.minute <= 21 ? 'MID' : 'LATE';
  const roleKey = ctx.role as 'TOP' | 'JGL' | 'MID' | 'BOT' | 'SUP';

  // Prefer role-specific scenarios (~65% when available for this phase/role), then general phase scenarios
  const roleSpecific = SCENARIO_POOL.filter(
    (s) => s.phase === phase && s.roles?.includes(roleKey) && !usedIds.has(s.id)
  );
  const roleAnyPhase = SCENARIO_POOL.filter(
    (s) => s.roles?.includes(roleKey) && !usedIds.has(s.id)
  );
  const generalPhase = SCENARIO_POOL.filter(
    (s) => s.phase === phase && (!s.roles || s.roles.includes(roleKey)) && !usedIds.has(s.id)
  );
  const fallbackAll = SCENARIO_POOL.filter((s) => !usedIds.has(s.id));

  let pool: ScenarioTemplate[];
  if (roleSpecific.length > 0 && Math.random() < 0.65) {
    pool = roleSpecific;
  } else if (generalPhase.length > 0) {
    pool = generalPhase;
  } else if (roleAnyPhase.length > 0) {
    pool = roleAnyPhase;
  } else if (fallbackAll.length > 0) {
    pool = fallbackAll;
  } else {
    pool = SCENARIO_POOL;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  usedIds.add(chosen.id);
  const fill = (txt: string) =>
    txt
      .replace(/\{oppName\}/g, ctx.oppName)
      .replace(/\{oppChamp\}/g, ctx.oppChamp)
      .replace(/\{oppTag\}/g, ctx.oppTag)
      .replace(/\{myTag\}/g, ctx.myTag);
  return {
    id: chosen.id,
    minute: ctx.minute,
    title: `Dakika ${ctx.minute}: ${chosen.title}`,
    desc: chosen.buildDesc(ctx),
    options: chosen.options.map((o) => ({ ...o, label: fill(o.label) })),
  };
}
