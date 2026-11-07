import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Disegni a pixel generati da strumenti/arte (vedi LEGGIMI.md). Ogni disegno ha la propria palette di colori
// (#rrggbb, fino a 62), l'eventuale versione di giorno (paletteGiorno), i cicli di palette per le animazioni
// (fuoco, stelle) e righe di pixel: ogni carattere e' l'indice del colore ("." = trasparente).

export const ILLUSTRAZIONI_MURA: readonly VoceContenuto[] = [
  voceIllustrazione("scena.mura", `
000000000000100210001000000030000000000000000000000000000000000000000000000000004040404040000000
000000000000222252200000000000000000000000000000000000000000000000000000000000040464040404000000
707070107012221555127070707070707070707070707070707070707070707070707070707070404646804040407070
000700022222225555522007000700070007060700070007000700070007000700070007000700040868080800040007
707010221552155515551522107070907070707070707070707070707070707070707070707040408880888088404070
070702225522225555522555270707070707070707970707070707070709070707070707070404080808a80808040407
77777212551222155512551552177777777777777777777777777377777777777779777777474687bababaac87874747
07770225555222225222555552770777077707770777077707770777077707770799977707740878aaaaaaccc8780767
d777122215521222122215551577d777d777d777d777d777d777d777d777d777d779d777d7474887bababaaca8874747
77777222555522222225555552277777777777777777777777777777777777777777777777747878aaaaaaaaa8787477
d7d7d21225155512221555155217d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d747878abababaaaaa878747
777d72222225222222255555227d777d777d777d777d777d777d777d777d777d777d777d77747878acaaaaaaa878777d
ddd71d221ee212221222152212d7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7dd474887cccabacaa8874d47
7d7d7d722ee2227d222ee2222d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d6d7d7d7d7d7d7d7d747878acaaaccca878747d
ddffff1ffeefff1ff21ee212ff1ffddddddddddddddddddddddddddddddddddddddddddddd4d4d8dbababaca8d8d4d4d
7dgggggggeeggggggggeegggggggg9dd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7ddd7dd47dd878d8a8d878d47ddd
hdgggggggggggggggggggggggggggdddhdddhdddhdddhddd3dddhdddhdddhdddhdddhdddhddd4d4d888d888d884d4ddd
ddddijiiijiiijiikjiiijikijidddddddddddddddddddd333ddddddddddddddddddddddddddd4d4d8d8d8d8d4d4dddd
hdhdjilijklijilijilijilkjildhdhdhdhdhdhdhdhdhdhd3dhdhdhdhdhdhdhdhdhdhdhdhdhdhd4d4d4d8d4d4d4dhdhd
dhdhiiiiikiiiiiikiiiiiikiiihdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhdhd46hd4dhd4dhdhdhdh
hhhdlkjklkjklkjklkjklkjklkjdhhhdhhhdhhhdhhhdhhhdhhhdhhhdhhhdhhhdhhhdhhhdhhhdhhhd4h4d4h4d4hhdhhhd
dhdhijkiijiiijiiijiikjiiijihdhdh3hdhdhdhdhdhdhdhdhdhdhdhd3dhd3dhdhdhdhdhdhdh6hdhdhdhdhdhdhd9dhdh
hhhhjilijilijklijilijilijilhhhhhhhhhhhhhhhhhhhhh3hhhhhhh333hhhhhhhhhhhhhhhhhhhhhh3hhhhhhhh999hhh
hhhhiikiiiiiikiiiiiikiiiiiihhhhhhhhhhhhhhhhhhhhhhhhhhhhhh3hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh9hhhh
mhhhlkjklkjklkjklkjklkjklkjhmhhhmhhhmhhhmhhhmhhhmh3hmhhhmhhhmhhhmhhhmhhhmhhhmhhhmhhhmhhhmhhhmhhh
hhhhijiiijkiijiiijiiijiikjihhhhhhhhhhhhhhhh3hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
mhmhjilijilinnnnnnnijilijilhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmh6hmhmhmhmhmhmhmhm9mhmhmh
hmhmiiiiiikinoopooniiiiikiimhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhmhm3mhmhmhm
mmmhlkjklkjknoopoonklkjklkjhm3mhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmh
mmhmijikijiinoopooniijiiijimmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhmmmhm
mmmmjilkjilinoopoonijklijilmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm
mmmmiiikiiiinoopooniikiiiiimqqqqqqqqqqqmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmqqqqqqqqqqqmmmmmmmmmmmmm
rmrmlkjklkjknoopoonklkjklkjqqqqqqqqqqqqqqqrmrmrmrmrmrmrmrmrmrmrmrmrmrqqqqqqqqqqqqqqqqqrmrmrmrmrm
mrmmkjiiijiknoopooniijiiijiqqqqqqqqqqqqqqqqqmrmmmrmmmrmmmrmmmrmmmrqqqqqqqqqqqqqqqqqqqqqqmrmmmrmm
qqqmjilijilknnnnnnnijilijklqqqqqqqqqqqqqqqqqqqqmrmrmrmrmrmrmrmrmqqqqqqqqqqqqqqqqqqqqqqqqqqqmrmrm
qqqqkiiiiiikiiiiiikiiiiiikiqqqqqqqqqqqqqqqqqqqqqqqmrmrmrmrmrmqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmr
qqqqlkjklkjklkjklkjklkjklkjqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq
qqqqijiikjiiijikijiiijkiijiqqqggggggqqqqggggggqqqqggggggqqqqggggggqqqqggggggqqqqggggggqqqqgggggg
qqqqjilijilijilkjilijilijilqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiij
qqqqiiiikiiiiiikiiiiiikiiiiqqqkkkkkkqqsqkkkkkkqqqqkkkkkkqqqqkkkkkkqqqqkkkkkkqqqqkkkkkkqqqqkkkkkk
gggglkjklkjklkjklkjklkjklkjqqqiiiiijqtttiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiij
uuuvijiiijiikjiiijikijiiijkqqqkkkkkkqssskkkkkkqqqqkkkkkkqqqqkkkkkkqqqqkkkkkkqqqqkkkkkkqqqqkkkkkk
uuuvjklijilijilijilkjilijilqqqiiiiijqsssiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiijqqqqiiiiij
uuuvikiiiiiikiiiiiikiiiiiikggggggggggwwwgggggggggggggggggggggggggggggggggggggggggggggggggggggggg
uuuvlkjklkjklkjklkjklkjklkjvvvvvvvvvvwwwvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
uuuvijiiijiiijiikjiiijikijiikiiiiiiikxxxiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiii
uuuvjilijklijilijilijilkjilijilijilixxxxxilijilijilijilijilijilijilijilijilijilijilijilijilijili
uuuviiiiikiiiiiikiiiiiikiiiikiiiiiiikyyyyiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiii
uuuvlkjklkjknnnnnnnklkjklkjklkjklkjklkzzlkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjk
uuuvijkiijiinoopoonikjiiijiiiiiikiiiiizzkiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiii
uuuvjilijilinoopoonijilijilijilijilijizzjilijilijilijilijilijilijilijilijilijilijilijilijilijili
uuuviikiiiiinoopoonikiiiiiiiiiiikiiiiizzkiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiii
uuuvlkjklkjknoopoonklkjklkjklkjklkjklkzzlkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjk
uuuvijiiijkinoopooniijiikjiikiiiiiiikizziiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiii
uuuvjilijilinoopoonijilijilijilijilijizzjilijilijilijilijilijilijilijilijilijilijilijilijilijili
uuuviiiiiikinoopooniiiiikiiikiiiiiiikizziiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiii
uuuvlkjklkjknnnnnnnklkjklkjklkjklkjklkzzlkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjk
uuuvijikijiiijkiijiiijiiijiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiii
uuuvjilkjilijilijilijklijilijilijilijilijilijilijilijilijilijilijilijilijilijilijilijilijilijili
uuuviiikiiiiiikiiiiiikiiiiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiii
uuuvlkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjklkjk
uuuvkjiiijikijiiijkiijiiijiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiii
uuuvjilijilkjilijilijilijklijilijilijilijilijilijilijilijilijilijilijilijilijilijilijilijilijili
uuuvkiiiiiikiiiiiikiiiiiikiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiiiiiiikiii
`, {
    palette: ["#0a0a30", "#52d36e", "#0e4d2b", "#ffffff", "#2e2ea0", "#1f8f45", "#d0d0ff", "#0d0d42", "#4a4ac8", "#ffe9a0", "#f6f2c4", "#d8d49a", "#c9c490", "#12125a", "#5a3a1c", "#b9bfc7", "#8f959e", "#191970", "#a33a1e", "#7a1f12", "#8a6a4a", "#c4552d", "#222288", "#1a1a22", "#ffd84a", "#3d2812", "#14304f", "#2e2ea0", "#ffb02a", "#ffe36a", "#3a3d46", "#5c626b", "#ff6a1a", "#c81e1e", "#555a63", "#6a4628", "#6a6ad0", "#6a6a9a", "#4a4a9a", "#ff9a2a"],
    paletteGiorno: ["#3a7bd5", "#8af0a0", "#1a7040", "#74b0ee", "#8cc2f2", "#3fb860", "#5e9ee8", "#4a8be0", "#a6d2f6", "#8cc2f2", "#f4f6ff", "#d8e0f0", "#c4cce0", "#5e9ee8", "#5a3a1c", "#cdd2d9", "#a4aab4", "#74b0ee", "#b8482a", "#8a2a1a", "#a8825a", "#d8683a", "#8cc2f2", "#1a1a22", "#3a4a6a", "#3d2812", "#4a7a9a", "#a6d2f6", "#ffb02a", "#ffe36a", "#4a4d58", "#707680", "#ff6a1a", "#c81e1e", "#555a63", "#6a4628", "#74b0ee", "#8cc2f2", "#5e9ee8", "#2a3a5a"],
    cicli: [{ indici: [3, 36], ritardoMs: 900 }, { indici: [9, 37], ritardoMs: 1300 }, { indici: [6, 38], ritardoMs: 700 }, { indici: [33, 32, 28, 29], ritardoMs: 130 }, { indici: [24, 39], ritardoMs: 700 }],
    ancora: { x: 52, y: 44 },
  }),
  voceIllustrazione("sprite.npc.beatrice", `
..........000.........
.........01110........
.......001111100......
......02111111120.....
.....0333333333330....
.....0333333333330....
......01111111110.....
......02454245420.....
......04444444440.....
......02424242420.....
.......044666440......
......02044244020.....
...0.0.000000000.0.0..
..0707078787373707070.
..0888088883333303330.
..08880788873337039990
..08880888833333039aa0
..08888787873737339aa0
..08888888833333339aa0
..08888788873337339aa0
..08888888833333339aa0
..088bbbbbbbbbbbbb9aa0
..088bbbbbbbbbbbbb9aa0
..04448788873337349aa0
..04448888833333349aa0
..07878787873737379aa0
...0888888833333339aa0
..07888788873337339aa0
...0888888833333339aa0
..07070cccc7cccc079aa0
...0.00cccc0cccc00000.
......0cccc0cccc0.....
......0cccc0cccc0.....
.....0ddddd0ddddd0....
.....0ddddd0ddddd0....
......00000.00000.....
`, {
    palette: ["#1b1d22", "#ff8ab8", "#ffc8a8", "#d055e0", "#f0a080", "#000000", "#c47860", "#5a0e68", "#8a1a9a", "#6a8af0", "#2a4ab8", "#ffd84a", "#4a2c14", "#7a4a22"],
  }),
  voceIllustrazione("sprite.npc.anselmo", `
..........000.........
.........01120........
.......001112200......
......03011122030.....
.......011112220......
......01114442220.....
.000..01144444220.....
055500114444444220....
0555011146444641110...
055500114444444110....
.070..01144444110.....
.070..03044444030.....
.070.0.000000000.0.0..
.07808081818282808080.
.07111011112222202220.
.07111081115222802220.
.07111011155522202220.
.07111181815282822220.
.07111111115222222220.
.07111181118222822220.
.07111111112222222220.
.07119999999999999220.
.07119999999999999220.
.07444181118222824440.
.07444111112222224440.
.07818181818282828280.
.0701111111222222220..
.07811181118222822280.
.0701111111222222220..
.07808088888888808080.
.070.0088880888800.0..
.070..08888088880.....
.070..08888088880.....
.070.0111110111110....
..0..0111110111110....
......00000.00000.....
`, {
    palette: ["#1b1d22", "#7a4a22", "#a8723a", "#ffc8a8", "#f0a080", "#ffd84a", "#000000", "#9a6a3a", "#4a2c14", "#c9cfd6"],
  }),
  voceIllustrazione("sprite.npc.ginevra", `
..........000.........
........0011100.......
.......011111110......
.....0011111111100....
....011111111111110...
.....0121112111210....
......03333333330.....
......04353435340.....
......03333333330.....
......04343434340.....
.......033666330......
......04033433040.....
...0.0.000000000.0.0..
..0101017171818101010.
..0777077778888808880.
..0999999999999999990.
..0799999999999999980.
..0799999999999999980.
..0799999999999999980.
..0799999999999999980.
..0779999999999999880.
..0779999999999999880.
..07799999aaa99999880.
..0333717abaaa8183330.
..033377abbbaaa883330.
..017171aabaaaa181810.
...07777aaaaaaa88880..
..0177717aaaaa8188810.
...0777777aaa8888880..
..01010cccc1cccc01010.
...0.00cccc0cccc00.0..
......0cccc0cccc0.....
......0cccc0cccc0.....
.....0ddddd0ddddd0....
.....0ddddd0ddddd0....
......00000.00000.....
`, {
    palette: ["#1b1d22", "#8a1a9a", "#ffd84a", "#f0a080", "#ffc8a8", "#000000", "#c47860", "#ff8ab8", "#d055e0", "#5a0e68", "#55ffff", "#ffffff", "#4a2c14", "#7a4a22", "#1a9aa8"],
    cicli: [{ indici: [10, 14], ritardoMs: 500 }],
  }),
  voceIllustrazione("sprite.npc.tobia", `
.......000000000......
......01111111110...0.
.....0222222222220.010
.....0222222222220.010
.....0222222222220.010
.....0333333333330.010
.....0333333333330.010
......04565356540..010
......05555355550..010
......04545354540.0770
.......055888550..0770
......04055455040..010
...0.0.000000000.0.010
..090909a9a9b9b9090910
..0aaa0aaaabbbbb0bbb10
..0aaa09aaa9bbb90bbb10
..0aaa0aaaabbbbb0bbb10
..0aaaa9a9a9b9b9bbbb10
..0aaaaaaaabbbbbbbbb10
..0aaaa9aaa9bbb9bbbb10
..0aaaaaaaabbbbbbbbb10
..0aa7777777777777bb10
..0aa7777777777777bb10
..0555a9aaa9bbb9b55510
..0555aaaaabbbbbb55510
..09a9a9a9a9b9b9b9b910
...0aaaaaaabbbbbbbb010
..09aaa9aaa9bbb9bbb910
...0aaaaaaabbbbbbbb010
..09090cccc9cccc090910
...0.00cccc0cccc00.010
......0cccc0cccc0..010
......0cccc0cccc0..010
.....0777770777770.010
.....0777770777770.010
......00000.00000...0.
`, {
    palette: ["#1b1d22", "#e6eaee", "#a0a7b2", "#555a63", "#ffc8a8", "#f0a080", "#000000", "#7a4a22", "#c47860", "#1a2a78", "#2a4ab8", "#6a8af0", "#4a2c14"],
  }),
  voceIllustrazione("sprite.npc.lorenzo", `
........0000000.......
.......011111110......
......00111111100.....
.....0222222222220....
.....0222222222220....
......03455555430.....
......04444444440.....
......03464346430.....
......044444444400000.
......0343434343777770
.......044888440999990
......0304434403999990
...0.0.000000000999990
..0a0a0ababacaca0a0d0.
..0bbb0bbbbccccc0ccd0.
..0bbb0abbbaccca0ccd0.
..0bbb0bbbbccccc0ccd0.
..0bbbbefefefefecccd0.
..0bbbbfffffffffcccd0.
..0bbbbefefefefecccd0.
..0bbbbfffffffffcccd0.
..0bbbbefefefefecccd0.
..0bbbbfffffffffcccd0.
..0444befefefefec44d0.
..0444bfffffffffc44d0.
..0ababefefefefecacd0.
...0bbbfffffffffccc0..
..0abbbefefefefeccca0.
...0bbbfffffffffccc0..
..0a0a0efefefefe0a0a0.
...0.0055550555500.0..
......05555055550.....
......05555055550.....
.....0222220222220....
.....0222220222220....
......00000.00000.....
`, {
    palette: ["#1b1d22", "#a8723a", "#7a4a22", "#ffc8a8", "#f0a080", "#4a2c14", "#000000", "#e6eaee", "#c47860", "#555a63", "#7a0e0e", "#b01a1a", "#ff6a6a", "#9a6a3a", "#8a909a", "#c9cfd6"],
  }),
  voceIllustrazione("sprite.npc.zita", `
......................
......................
......................
......................
...........0..........
..........010.........
..........010.........
.........01110........
........0111110.......
.......011111110......
......01111111110.....
.....0111122211110....
......01122222110.....
......01222222210.....
......01232223210.....
......04222222240.....
......02222222220.....
......04242224240.....
.......002222200......
.......000000000......
...00005555666660000..
..0555015151616106660.
..0555055556666606660.
..0555015551666106660.
..0555555556666666660.
..0555515151616166660.
..0575555556666666660.
..0877515551666166660.
.07777755556666666660.
..0777515151616166660.
..0272555556666662220.
..0222515551666162220.
...05555555666666660..
..0151515151616161610.
...05555555666666660..
....000000000000000...
`, {
    palette: ["#1b1d22", "#1a2a78", "#f0a080", "#000000", "#ffc8a8", "#1a9aa8", "#55ffff", "#ffd84a", "#fff0a0"],
  }),
];
