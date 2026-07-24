// lang-tree-core.ts — data + layout shared by the interactive tree and the poster.
// Verbatim TypeScript port of lang-tree-core.js. Layout math, PRNG, rounding and
// string building are unchanged; this is a deterministic layout, so any drift here
// changes the rendered tree.

export interface SceneBlob { x: number; y: number; r: number; f: string; o: number }
export interface SceneSeg { d: string; w: number; c: string }
export interface SceneLabel {
	id: string; t: string; x: number; y: number; deg: number; fs: number; fill: string;
	an: 'start' | 'middle' | 'end'; ff: string; fw: string; fst: string; ls: string;
	hw: number; kind: 'family' | 'branch' | 'lang'; s?: number;
}
export interface RegNode {
	id: string; name: string; kind: 'Family' | 'Branch' | 'Language'; lineage: string;
	s: number; count: number; region?: string; note?: string; x: number; y: number;
	color: string; ext: boolean;
}
export interface SceneFamily { id: string; name: string; color: string; sTxt: string; count: number; x: number; y: number }
export interface Scene {
	W: number; H: number; blobs: SceneBlob[]; segs: SceneSeg[]; labels: SceneLabel[];
	reg: Record<string, RegNode>; families: SceneFamily[]; nLang: number;
}

// Raw tree node as built by L/X/B below, then progressively mutated in place by
// prep()/place() during layout — mirrors the original JS object-literal-plus-mutation
// shape; fields filled in later are optional here.
interface LNode {
	n: string;
	s?: number;
	g?: string;
	note?: string;
	ext?: 1;
	c?: LNode[];
	ci?: number;
	id?: string;
	depth?: number;
	fam?: LNode;
	path?: string[];
	total?: number;
	count?: number;
	w?: number;
	fsD?: number;
	a?: number;
	rr?: number;
	x?: number;
	y?: number;
}

const L = (n: string, s: number, g: string, note?: string): LNode => ({ n, s, g, note });
const X = (n: string, g: string, note?: string): LNode => ({ n, s: 0, ext: 1, g, note });
const B = (n: string, c: LNode[]): LNode => ({ n, c });

const FAMS: LNode[] = [
B('Sino-Tibetan', [
  B('Sinitic', [
    L('Mandarin', 941, 'China, Taiwan, Singapore', 'The most spoken native language on Earth.'),
    L('Yue (Cantonese)', 86, 'Guangdong, Hong Kong, Macau'),
    L('Wu (Shanghainese)', 83, 'Shanghai, Zhejiang'),
    L('Min', 75, 'Fujian, Taiwan'),
    L('Hakka', 44, 'Southern China, Taiwan'),
    L('Xiang', 38, 'Hunan'),
    L('Gan', 22, 'Jiangxi')
  ]),
  B('Tibeto-Burman', [
    L('Burmese', 33, 'Myanmar'),
    L('Tibetan', 6.2, 'Tibetan Plateau'),
    L('Karen', 4.5, 'Myanmar–Thailand border'),
    L('Yi (Nuosu)', 2.8, 'Sichuan, Yunnan'),
    L('Meitei', 1.8, 'Manipur, India'),
    L('Newar', 0.85, 'Kathmandu Valley')
  ])
]),
B('Kra-Dai', [
  B('Tai', [
    L('Thai', 36, 'Thailand'),
    L('Isan', 22, 'Northeast Thailand'),
    L('Zhuang', 16, 'Guangxi, China'),
    L('Lao', 3.7, 'Laos'),
    L('Shan', 3.3, 'Shan State, Myanmar')
  ])
]),
B('Austroasiatic', [
  B('Mon-Khmer', [
    L('Vietnamese', 85, 'Vietnam'),
    L('Khmer', 17, 'Cambodia'),
    L('Khasi', 1.4, 'Meghalaya, India'),
    L('Mon', 0.9, 'Myanmar, Thailand')
  ]),
  B('Munda', [
    L('Santali', 7.6, 'India, Bangladesh'),
    L('Mundari', 1.1, 'Jharkhand, India')
  ])
]),
B('Japonic', [
  L('Japanese', 123, 'Japan'),
  L('Ryukyuan', 1, 'Ryukyu Islands, Japan')
]),
B('Koreanic', [
  L('Korean', 81, 'Korean Peninsula & diaspora'),
  L('Jeju', 0.01, 'Jeju Island (critically endangered)')
]),
B('Austronesian', [
  B('Malayo-Polynesian', [
    L('Javanese', 82, 'Java, Indonesia'),
    L('Malay–Indonesian', 82, 'Indonesia, Malaysia, Brunei', 'Second language of 200M+ more across the archipelago.'),
    L('Sundanese', 32, 'West Java'),
    L('Tagalog', 29, 'Philippines'),
    L('Malagasy', 25, 'Madagascar', 'Carried 7,000 km across the Indian Ocean by Bornean seafarers.'),
    L('Cebuano', 20, 'Central Philippines'),
    L('Madurese', 8, 'Madura, Indonesia'),
    L('Ilocano', 7, 'Northern Philippines'),
    L('Hiligaynon', 7, 'Western Visayas'),
    L('Minangkabau', 5.5, 'West Sumatra'),
    L('Balinese', 3.3, 'Bali'),
    L('Acehnese', 2.8, 'Aceh, Sumatra')
  ]),
  B('Oceanic', [
    L('Fijian', 0.35, 'Fiji'),
    L('Samoan', 0.51, 'Samoa'),
    L('Tongan', 0.19, 'Tonga'),
    L('Tahitian', 0.07, 'French Polynesia'),
    L('Māori', 0.05, 'New Zealand'),
    L('Hawaiian', 0.02, 'Hawaiʻi')
  ]),
  B('Formosan', [
    L('Amis', 0.18, 'Taiwan', 'Taiwan is the ancestral homeland of the whole family.')
  ])
]),
B('Dravidian', [
  L('Telugu', 83, 'Andhra Pradesh, Telangana'),
  L('Tamil', 79, 'Tamil Nadu, Sri Lanka, Singapore', 'A literary tradition more than 2,000 years old.'),
  L('Kannada', 44, 'Karnataka'),
  L('Malayalam', 37, 'Kerala'),
  L('Gondi', 2.9, 'Central India'),
  L('Brahui', 2.2, 'Balochistan, Pakistan', 'A Dravidian island far to the north-west.'),
  L('Tulu', 1.8, 'Coastal Karnataka')
]),
B('Indo-European', [
  B('Indo-Aryan', [
    L('Hindi', 345, 'Northern India'),
    L('Bengali', 237, 'Bangladesh, West Bengal'),
    L('Punjabi', 113, 'Punjab (Pakistan & India)'),
    L('Marathi', 83, 'Maharashtra'),
    L('Urdu', 70, 'Pakistan, India'),
    L('Gujarati', 57, 'Gujarat'),
    L('Bhojpuri', 52, 'Bihar, Uttar Pradesh'),
    L('Odia', 35, 'Odisha'),
    L('Maithili', 34, 'Bihar, Nepal'),
    L('Sindhi', 32, 'Sindh, Pakistan'),
    L('Nepali', 16, 'Nepal'),
    L('Sinhala', 16, 'Sri Lanka'),
    L('Assamese', 15, 'Assam'),
    L('Romani', 3.5, 'Dispersed across Europe', 'Left India roughly 1,000 years ago.'),
    X('Sanskrit', 'Liturgical, South Asia', 'Classical language of Hindu, Buddhist and Jain texts.')
  ]),
  B('Iranian', [
    L('Persian', 72, 'Iran, Afghanistan (Dari)'),
    L('Pashto', 44, 'Afghanistan, Pakistan'),
    L('Kurdish', 26, 'Kurdistan (TR, IQ, IR, SY)'),
    L('Balochi', 8.8, 'Balochistan'),
    L('Tajik', 8.1, 'Tajikistan'),
    L('Ossetian', 0.45, 'Caucasus')
  ]),
  B('Slavic', [
    L('Russian', 147, 'Russia & former USSR'),
    L('Polish', 40, 'Poland'),
    L('Ukrainian', 33, 'Ukraine'),
    L('Serbo-Croatian', 18, 'Serbia, Croatia, Bosnia, Montenegro'),
    L('Czech', 10.7, 'Czechia'),
    L('Bulgarian', 7.9, 'Bulgaria'),
    L('Slovak', 5.2, 'Slovakia'),
    L('Belarusian', 5.1, 'Belarus'),
    L('Slovene', 2.1, 'Slovenia'),
    L('Macedonian', 1.6, 'North Macedonia')
  ]),
  B('Romance', [
    L('Spanish', 486, 'Latin America & Spain', 'The largest Romance language by native speakers.'),
    L('Portuguese', 240, 'Brazil, Portugal, Lusophone Africa'),
    L('French', 74, 'France, Canada, Africa', 'An additional 200M+ speak it as a second language.'),
    L('Italian', 64, 'Italy, Switzerland'),
    L('Romanian', 24, 'Romania, Moldova'),
    L('Sicilian', 4.7, 'Sicily'),
    L('Catalan', 4.1, 'Catalonia, Valencia, Balearics'),
    L('Venetian', 3.9, 'Veneto, Italy'),
    L('Galician', 2.4, 'Galicia, Spain'),
    L('Sardinian', 1, 'Sardinia'),
    L('Occitan', 0.5, 'Southern France'),
    X('Latin', 'Ancient Rome', 'Ancestor of every Romance language.')
  ]),
  B('Germanic', [
    L('English', 380, 'Worldwide', 'With second-language speakers, understood by some 1.5 billion people.'),
    L('German', 95, 'Germany, Austria, Switzerland'),
    L('Dutch', 25, 'Netherlands, Flanders'),
    L('Swedish', 10, 'Sweden, Finland'),
    L('Afrikaans', 7.2, 'South Africa, Namibia'),
    L('Danish', 6, 'Denmark'),
    L('Norwegian', 5.3, 'Norway'),
    L('Yiddish', 0.6, 'Ashkenazi diaspora'),
    L('Frisian', 0.5, 'Friesland, Netherlands'),
    L('Icelandic', 0.37, 'Iceland'),
    L('Faroese', 0.07, 'Faroe Islands'),
    X('Gothic', 'Ancient Eastern Europe', 'The oldest Germanic language with a written record.')
  ]),
  B('Hellenic', [
    L('Greek', 13.5, 'Greece, Cyprus', 'A written record spanning 3,400 years.')
  ]),
  B('Celtic', [
    L('Welsh', 0.9, 'Wales'),
    L('Breton', 0.21, 'Brittany, France'),
    L('Irish', 0.17, 'Ireland'),
    L('Scottish Gaelic', 0.06, 'Scottish Highlands'),
    L('Cornish', 0.001, 'Cornwall', 'Revived after dying out around 1800.')
  ]),
  B('Baltic', [
    L('Lithuanian', 3, 'Lithuania', 'Often called the most conservative living Indo-European language.'),
    L('Latvian', 1.5, 'Latvia')
  ]),
  L('Albanian', 7.5, 'Albania, Kosovo', 'A branch of its own within Indo-European.'),
  L('Armenian', 5.3, 'Armenia & diaspora', 'A branch of its own, with a unique alphabet since 405 CE.')
]),
B('Turkic', [
  L('Turkish', 84, 'Türkiye'),
  L('Uzbek', 35, 'Uzbekistan'),
  L('Azerbaijani', 24, 'Azerbaijan, NW Iran'),
  L('Kazakh', 13, 'Kazakhstan'),
  L('Uyghur', 11, 'Xinjiang, China'),
  L('Turkmen', 7, 'Turkmenistan'),
  L('Tatar', 5.2, 'Tatarstan, Russia'),
  L('Kyrgyz', 5.1, 'Kyrgyzstan'),
  L('Bashkir', 1.2, 'Bashkortostan, Russia'),
  L('Chuvash', 0.7, 'Chuvashia, Russia', 'Sole survivor of the Oghur branch.'),
  L('Yakut (Sakha)', 0.45, 'Eastern Siberia')
]),
B('Mongolic', [
  L('Mongolian', 5.7, 'Mongolia, Inner Mongolia'),
  L('Buryat', 0.33, 'Siberia'),
  L('Kalmyk', 0.08, 'Kalmykia, Russia')
]),
B('Uralic', [
  B('Finnic', [
    L('Finnish', 5.4, 'Finland'),
    L('Estonian', 1.1, 'Estonia'),
    L('Karelian', 0.08, 'Karelia'),
    L('Veps', 0.003, 'Northwest Russia')
  ]),
  B('Ugric', [
    L('Hungarian', 12.6, 'Hungary', 'Carried to the Danube basin around 900 CE.'),
    L('Khanty', 0.01, 'Western Siberia'),
    L('Mansi', 0.001, 'Western Siberia')
  ]),
  L('Sami', 0.03, 'Northern Scandinavia'),
  L('Erzya', 0.3, 'Mordovia, Russia'),
  L('Nenets', 0.02, 'Arctic Russia')
]),
B('Kartvelian', [
  L('Georgian', 3.8, 'Georgia', 'Written in its own alphabet since the 5th century.'),
  L('Mingrelian', 0.3, 'Western Georgia'),
  L('Svan', 0.014, 'Caucasus highlands')
]),
B('Afro-Asiatic', [
  B('Semitic', [
    L('Arabic', 380, 'North Africa & Middle East', 'A continuum of varieties from Morocco to Oman.'),
    L('Amharic', 35, 'Ethiopia'),
    L('Tigrinya', 9.9, 'Eritrea, Tigray'),
    L('Hebrew', 5.3, 'Israel', 'Revived as a spoken native language in the 20th century.'),
    L('Aramaic', 0.8, 'Scattered Middle East', 'Once the lingua franca of the ancient Near East.'),
    L('Maltese', 0.5, 'Malta', 'The only Semitic language written in the Latin alphabet.')
  ]),
  B('Cushitic', [
    L('Oromo', 45, 'Ethiopia, Kenya'),
    L('Somali', 24, 'Horn of Africa'),
    L('Afar', 2.6, 'Djibouti, Eritrea, Ethiopia')
  ]),
  B('Chadic', [
    L('Hausa', 58, 'Nigeria, Niger', "West Africa's great lingua franca.")
  ]),
  B('Berber', [
    L('Tashelhit', 7, 'Southern Morocco'),
    L('Kabyle', 6, 'Kabylia, Algeria'),
    L('Tamazight', 4.7, 'Atlas Mountains, Morocco'),
    L('Tuareg', 1.2, 'Central Sahara')
  ]),
  B('Egyptian', [
    X('Coptic', 'Liturgical, Egypt', 'Last descendant of Ancient Egyptian; liturgical today.')
  ])
]),
B('Niger-Congo', [
  B('Bantu', [
    L('Swahili', 18, 'East African coast', 'Second language of 80M+ across East Africa.'),
    L('Kinyarwanda', 15, 'Rwanda'),
    L('Chichewa', 14, 'Malawi, Zambia'),
    L('Zulu', 13, 'South Africa'),
    L('Shona', 11, 'Zimbabwe'),
    L('Xhosa', 8.3, 'South Africa'),
    L('Sesotho', 5.6, 'Lesotho, South Africa'),
    L('Luganda', 5.6, 'Uganda'),
    L('Lingala', 5.5, 'Congo River basin')
  ]),
  B('Volta-Niger', [
    L('Yoruba', 47, 'SW Nigeria, Benin'),
    L('Igbo', 31, 'SE Nigeria'),
    L('Ewe', 5, 'Ghana, Togo'),
    L('Fon', 2.3, 'Benin')
  ]),
  B('Atlantic', [
    L('Fula', 37, 'Sahel, West Africa'),
    L('Wolof', 5.9, 'Senegal')
  ]),
  B('Kwa', [
    L('Akan', 22, 'Ghana')
  ]),
  B('Gur', [
    L('Mooré', 8, 'Burkina Faso')
  ]),
  B('Mande', [
    L('Bambara', 4.2, 'Mali', 'Grouping within Niger-Congo is debated.')
  ])
]),
B('Other families & isolates', [
  B('Nilo-Saharan', [
    L('Kanuri', 8, 'Lake Chad basin'),
    L('Luo', 4.2, 'Kenya, Tanzania'),
    L('Songhay', 3, 'Niger River bend'),
    L('Dinka', 1.4, 'South Sudan')
  ]),
  B('Quechuan', [
    L('Quechua', 7.2, 'Andes', 'Language of the Inca Empire.')
  ]),
  B('Tupian', [
    L('Guarani', 6.5, 'Paraguay', 'Co-official with Spanish; spoken by most Paraguayans.')
  ]),
  B('Aymaran', [
    L('Aymara', 1.7, 'Bolivia, Peru')
  ]),
  B('Uto-Aztecan', [
    L('Nahuatl', 1.7, 'Central Mexico', 'Language of the Aztec Empire.')
  ]),
  B('Mayan', [
    L("K'iche'", 1.1, 'Guatemala'),
    L('Yucatec Maya', 0.8, 'Yucatán, Mexico')
  ]),
  B('Na-Dene', [
    L('Navajo', 0.17, 'SW United States', 'The most spoken Indigenous language north of Mexico.')
  ]),
  B('Eskimo-Aleut', [
    L('Greenlandic', 0.06, 'Greenland'),
    L('Inuktitut', 0.04, 'Arctic Canada')
  ]),
  B('Pama-Nyungan', [
    L('Warlpiri', 0.003, 'Central Australia')
  ]),
  B('Isolates', [
    L('Basque', 0.75, 'Basque Country', "No demonstrated relatives — Europe's oldest survivor."),
    L('Burushaski', 0.1, 'Karakoram, Pakistan'),
    L('Ainu', 0.001, 'Hokkaido, Japan', 'Critically endangered isolate.')
  ])
])
];

const PAL = ['#46698a', '#33536e', '#5d83a1', '#6f94ac', '#3e6784', '#54788f'];
const FF_GAR = "'EB Garamond', Georgia, serif";
const FF_FELL = "'IM Fell English SC', Georgia, serif";
const INK = '#243441', EXT = '#8b8170';
const OTHER = 'Other families & isolates';

export const fmt = (s: number): string => s === 0 ? 'Extinct / revived' : s >= 99.5 ? Math.round(s) + ' M' : s >= 1 ? (Math.round(s * 10) / 10) + ' M' : Math.round(s * 1000) + ',000';

function mulberry(a: number): () => number {
	return function () {
		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
const r1 = (v: number): number => Math.round(v * 10) / 10;

let _scene: Scene | null = null;
export function buildScene(): Scene {
	if (_scene) return _scene;
	const W = 2960, H = 1800, cx = 1480, cy = 1580, YS = 0.94, A0 = -1.28, A1 = 1.28;
	const colOf = (f: LNode): string => f.n === OTHER ? '#7b8a94' : PAL[f.ci! % PAL.length];

	// pass 1: totals, counts, angular widths
	let nid = 0; const nodes: LNode[] = [];
	function prep(nd: LNode, depth: number, fam: LNode, path: string[]): void {
		nd.id = 'n' + (nid++); nd.depth = depth; nd.fam = fam; nd.path = path; nodes.push(nd);
		if (nd.c) {
			nd.total = 0; nd.count = 0;
			nd.c.forEach(k => { prep(k, depth + 1, fam, path.concat(nd.n)); nd.total! += k.total!; nd.count! += k.count!; });
			nd.w = nd.c.reduce((a, k) => a + k.w!, 0);
		} else {
			nd.total = nd.s; nd.count = 1;
			const big = nd.s! >= 20;
			nd.fsD = big ? Math.min(38, 11 + 4.3 * Math.log1p(nd.s!)) : Math.min(16.5, 11.5 + 2.6 * Math.log1p(nd.s!));
			nd.w = big ? 2.3 * nd.fsD : (nd.fsD + 7) / 2;
		}
	}
	FAMS.forEach((f, i) => { f.ci = i; prep(f, 1, f, []); });
	const totalW = FAMS.reduce((a, f) => a + f.w!, 0);
	const unit = (A1 - A0) / totalW;
	const sc = unit * 1080; // px of arc per width-unit at the inner leaf ring

	// pass 2: angles & radii
	let cur = 0, li = 0, sli = 0;
	function place(nd: LNode): void {
		if (!nd.c) {
			nd.a = A0 + (cur + nd.w! / 2) * unit; cur += nd.w!;
			const big = nd.s! >= 20;
			nd.rr = big ? 1085 + (li % 4) * 52 + Math.min(50, nd.s! * 0.055) : 1080 + (sli % 2) * 170;
			if (!big) sli++;
			li++;
		} else {
			nd.c.forEach(place);
			nd.a = nd.c.reduce((a, k) => a + k.a! * k.w!, 0) / nd.w!;
			const avg = nd.c.reduce((a, k) => a + k.rr!, 0) / nd.c.length;
			nd.rr = avg - 260;
			if (nd.depth === 1) nd.rr = Math.max(330, Math.min(540, nd.rr));
			else nd.rr = Math.max(560, nd.rr);
		}
		nd.x = cx + Math.sin(nd.a!) * nd.rr!;
		nd.y = cy - Math.cos(nd.a!) * nd.rr! * YS;
	}
	FAMS.forEach(place);

	// segments
	const segs: SceneSeg[] = [];
	const totalAll = FAMS.reduce((a, f) => a + f.total!, 0);
	segs.push({ d: 'M' + cx + ' ' + (H - 15) + ' L' + cx + ' ' + cy, w: r1(6 + 1.55 * Math.sqrt(totalAll)), c: INK });
	function seg(x1: number, y1: number, a1: number, nd: LNode): void {
		const x2 = nd.x!, y2 = nd.y!, a2 = nd.a!;
		const d = Math.hypot(x2 - x1, y2 - y1);
		const c1x = x1 + Math.sin(a1) * d * .38, c1y = y1 - Math.cos(a1) * d * .38;
		const c2x = x2 - Math.sin(a2) * d * .34, c2y = y2 + Math.cos(a2) * d * .34;
		const ext = nd.total === 0;
		segs.push({
			d: 'M' + r1(x1) + ' ' + r1(y1) + ' C' + r1(c1x) + ' ' + r1(c1y) + ' ' + r1(c2x) + ' ' + r1(c2y) + ' ' + r1(x2) + ' ' + r1(y2),
			w: r1(2.3 + 1.5 * Math.sqrt(nd.total!)), c: ext ? EXT : INK
		});
		if (nd.c) nd.c.forEach(k => seg(x2, y2, a2, k));
	}
	FAMS.forEach(f => {
		const bx = cx + Math.sin(f.a!) * 80, by = cy - Math.cos(f.a!) * 80;
		seg(bx, by, f.a! * 0.45, f);
	});

	// canopy blobs
	const blobs: SceneBlob[] = [];
	FAMS.forEach((f, fi) => {
		const rnd = mulberry(fi * 97 + 3);
		const leaves: LNode[] = [];
		(function g(n: LNode): void { n.c ? n.c.forEach(g) : leaves.push(n); })(f);
		for (let i = 0; i < leaves.length; i += 3) {
			const grp = leaves.slice(i, i + 3);
			const mx = grp.reduce((a, k) => a + k.x!, 0) / grp.length;
			const my = grp.reduce((a, k) => a + k.y!, 0) / grp.length;
			const ma = grp.reduce((a, k) => a + k.a!, 0) / grp.length;
			const spread = grp.length > 1 ? Math.hypot(grp[grp.length - 1].x! - grp[0].x!, grp[grp.length - 1].y! - grp[0].y!) : 0;
			blobs.push({
				x: r1(mx + Math.sin(ma) * 35), y: r1(my - Math.cos(ma) * 35),
				r: r1(Math.min(190, Math.max(75, spread * 0.62)) + rnd() * 40),
				f: colOf(f), o: r1(0.32 + rnd() * 0.14)
			});
		}
	});

	// labels
	const labels: SceneLabel[] = [];
	function lab(nd: LNode, fidx: number): void {
		if (nd.c) {
			const isFam = nd.depth === 1;
			if (isFam || nd.c.length > 1) {
				const other = nd.n === OTHER;
				let fs = isFam ? Math.max(20, Math.min(38, 12 + 4.2 * Math.log1p(nd.total!))) : Math.max(15, Math.min(21, 10 + 2.6 * Math.log1p(nd.total!)));
				if (other) fs = 22;
				const fill = isFam ? (other ? '#5d6d7b' : '#1d2c39') : '#4a6175';
				const span = nd.w! * unit;
				if (span < 0.055) {
					const right = nd.a! >= 0, deg = nd.a! * 180 / Math.PI;
					const lr = 1445;
					const x = r1(cx + Math.sin(nd.a!) * lr), y = r1(cy - Math.cos(nd.a!) * lr * YS);
					labels.push({ id: nd.id!, t: nd.n.toUpperCase(), x, y, deg: r1(right ? deg - 90 : deg + 90), fs: r1(Math.min(fs, 26)), fill, an: right ? 'start' : 'end', ff: isFam ? FF_FELL : FF_GAR, fw: '400', fst: 'normal', ls: '2', hw: 5, kind: isFam ? 'family' : 'branch' });
				} else {
					const lr = nd.rr! + (isFam ? (50 + (fidx % 3) * 75) : 0);
					const x = r1(cx + Math.sin(nd.a!) * lr), y = r1(cy - Math.cos(nd.a!) * lr * YS - (isFam ? 0 : 12));
					labels.push({ id: nd.id!, t: nd.n.toUpperCase(), x, y, deg: 0, fs: r1(fs), fill, an: 'middle', ff: isFam ? FF_FELL : FF_GAR, fw: isFam ? '400' : '600', fst: 'normal', ls: isFam ? '3' : '2.5', hw: isFam ? 6 : 5, kind: isFam ? 'family' : 'branch' });
				}
			}
			nd.c.forEach(k => lab(k, fidx));
		} else {
			const ext = nd.total === 0, big = nd.s! >= 20;
			const off = big ? 26 : 20;
			const x = r1(nd.x! + Math.sin(nd.a!) * off), y = r1(nd.y! - Math.cos(nd.a!) * off * 0.94);
			if (big) {
				const steep = Math.abs(nd.a!) > 0.85;
				const an: 'start' | 'middle' | 'end' = steep ? (nd.a! >= 0 ? 'start' : 'end') : 'middle';
				const sx = steep ? r1(nd.x! + Math.sin(nd.a!) * 46) : x;
				const sy = steep ? r1(nd.y! - Math.cos(nd.a!) * 46 * 0.94) : y;
				labels.push({ id: nd.id!, t: nd.n, x: sx, y: sy, deg: 0, fs: r1(nd.fsD!), fill: '#22374a', an, ff: FF_GAR, fw: '600', fst: 'normal', ls: '0', hw: 5, kind: 'lang', s: nd.s });
			} else {
				const right = nd.a! >= 0, deg = nd.a! * 180 / Math.PI;
				labels.push({ id: nd.id!, t: nd.n + (ext ? ' †' : ''), x, y, deg: r1(right ? deg - 90 : deg + 90), fs: r1(Math.max(8, Math.min(nd.fsD!, (nd.fsD! + 7) * sc - 5))), fill: ext ? EXT : '#33475a', an: right ? 'start' : 'end', ff: FF_GAR, fw: '400', fst: ext ? 'italic' : 'normal', ls: '0', hw: 4, kind: 'lang', s: nd.s });
			}
		}
	}
	FAMS.forEach((f, i) => lab(f, i));

	// registry for search & info cards
	const reg: Record<string, RegNode> = {};
	nodes.forEach(nd => {
		const kind: 'Family' | 'Branch' | 'Language' = nd.c ? (nd.depth === 1 ? 'Family' : (nd.fam!.n === OTHER && nd.depth === 2 ? 'Family' : 'Branch')) : 'Language';
		reg[nd.id!] = { id: nd.id!, name: nd.n, kind, lineage: nd.path!.join(' › '), s: nd.total!, count: nd.count!, region: nd.g, note: nd.note, x: nd.x!, y: nd.y!, color: colOf(nd.fam!), ext: !nd.c && nd.total === 0 };
	});

	const families: SceneFamily[] = FAMS.map(f => ({ id: f.id!, name: f.n, color: colOf(f), sTxt: fmt(f.total!), count: f.count!, x: f.x!, y: f.y! }));
	const nLang = FAMS.reduce((a, f) => a + f.count!, 0);

	_scene = { W, H, blobs, segs, labels, reg, families, nLang };
	return _scene;
}
