import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Disegni a pixel generati da strumenti/arte (vedi LEGGIMI.md). Ogni disegno ha la propria palette di colori
// (#rrggbb, fino a 62), l'eventuale versione di giorno (paletteGiorno), i cicli di palette per le animazioni
// (fuoco, stelle) e righe di pixel: ogni carattere e' l'indice del colore ("." = trasparente).

export const ILLUSTRAZIONI_CLASSI: readonly VoceContenuto[] = [
  voceIllustrazione("scena.creazione", `
001010101010101000000020000000000000000000000000000300000000000000000000000000000000000000000000
010101010101010100000000000000000000000000000000000400000000000000000000000000000000000000000000
101010505050101010606060606060606060606060606060604430606060606060606060606060606060606060606060
000105050505000100060006000600060006000600060006004430067006000600060006000600060006000600060006
101055508559551010606060606060606060606060606060644433606060606060606060606060606060606060606060
010505aaaa9995010106060bbbbb06060606060606060607044433060606060606060606060606060606060606060606
16565a8a8aa956561666666bbbbb666666666666666666664444333666666666c6666666666666666666666666666666
06050aaaaaaa050106060606ddd60606e60606060606060644443336060606ccccc60606060606060606060606060606
15568a8a8aaaa55616166666ddd6666666666666666666644444333366666cfffccc6666666666666666e66666666666
616569aaaaaa656161666666ddd6666666666666666666644444333366666cfffccc6666666666666666666666666666
16g699ha8aha56g616i666i6ddd666i666i666i666i666444444333336i6ccfffccccei666i66ji666i666i666i666i6
666569aaa9996561667666kkkkkkk66666666666666666444444333336666ccccccc666666jjjjjjj666666666666666
l6l6g5g6m5h6g5l6l777ikkkkkkkkki6i6i6i6i6i6i6i4444444333333i6iccccccci6i6ijjjjjjjjji6i6i676i6i6i6
6l6l6g6g6g6g6l6l6i7i6nnnnnnnnn6i6i6i6i6i6i6ooooooooooooooooo6iccccci6i6ijjjjjpjjjjji6i6i6i6i6i6i
l6lil6gig6gil6lil6iiinnpppppnniii6iii6iii6ioooooooooooooooooi6iicqiii6iijjjpppppjjjii6iii6iii6ii
6i6l6i6l6i6l6i6l6i6iknnnnnnnnnki6i6i6i6i6i6i6i6irrrrrrri6i6i6i6iqq6i6i6ijjpppspppjji6i6i6i6i6i6i
iilililililililiiiiiinnnnnnnnniiittiiiiiiiiiiiiiuvvrvvuiiiiiiiiiqqiiiiijjjpssssspjjjeiiiiiiiiiii
iiiiililililiiiiiiiiikkkkkkkkkiiittiiiiiiiiiiiirrrrrrrrriiiiiiiiqqiiiiiijppoosooppjiiiiiiiiiiiii
iiwiiiweliwiiiwiiiwiikkkkkkkkkwiittiiiwiiiwiiiwiurururuiiiwiiiwiqqwiiiwijjsssssssjjieiwiiiwiiiwi
iiiiiiiiiiiiiiiiiiiiiikkkkkkkiiiittiiiiiiiiiiiiirrrrrrriiiiii7iiqqiiiiiijjpssssspjjeeeii7iiiiiii
wiwiwiwiwiwiwiwiwiwnnktktktktktkwttiwiwiwixixixiurururuixixixiwiqqwiwiwiyjjsssssjjwiyiwiwiwiwiwi
iwiwiwiwiwiwiwiwiwinntkkktkkktkwittwiwiwiwiwiwiwiwiriwiwiwiwiwiwqqiwiwiwiwjjjsjjjwiwiwiwiwiwiwiw
wiwwwiwwwiwzAzAzAzAzAktktktktktwwttwwiwwwixwxiBBBBBBBBBBBixwxiwwqqwwwiywwiywwjywwiywwiwwwiwwwiww
iwiwCwiwiwizzzzzzzzzzkkkkkkkkkkwittwiwiwiwiwiwiBBBBBBBBBiwiwiwiwqqiwiwiwiwiwipiwieeeiwiwiwCwiwiw
wwwDDDwwwwwzAzAffzAzAktktktktktwwttwwwwwwwxwxwxwBBBBBBBwxwxwxwwwqqwwwwwwywwwypjwywewywwwwDDDwwww
wwwDDDwwwwwzzAzffAzzztkkktkkktkwwttwwwwwwwwwwwwwBBBBBBBwwwwwwwwwqqwwwwwwwwwwjpjwwwwwwwwwwDDDwwww
wwECCCEwwwEzAzAffzAzAktktktktktwwttwwwEwwwxwxwxwxBBBBBxwxwxwxwEwqqEwwwywwwywjpywwwywwwEwwCCCwwEw
wwwCCCwwwwwzzzzffzzzzkkkkkkkkkkwwttwwwwwwwwwwwwwwBBBBBwwwwwwwwwwqqwwwwwwwwwwjpjwwwwwwwwwwCCCwwww
EwEFFFEwEwEzAzAffzAzAktktktktktwEttwEwEwEwxwxwxwx4BBB3xwxwxwxwEwqqEwEwEwywEjyppjywEwywEwEFFFEwEw
wEwFFFwEwEwzffffffffztkkktkkktkEwttEwEwEwEwEwEwEw4BBB3wEwEwEwEwEqqwEwEwEwEwjpppjwEwEwEwEwFFFwEwE
EwEGGGEEEwEzffffffffAqqqqqqqqqqEHttHHHHHHHxHxwxEx4xBx3xExwxExwEEqqEEEwyEEwyjppyjEwyHHHIIIGGGHHEE
wEwGGGwEwEwzzzzffzzzzqqqqqqqqqqHHttHHHHHHHHHHHHE4444333EwEwEwEwEqqwEwEwEwEwjpppjHHHHHHIIIGGGHHHH
EEGGGGGEEEEzAzAffzAzAktktktktktHHttHHHHHHHxHxHxHx4x4x3xExExExEEEqqEEEEEEyEjjyppjyHHHyHIIIGGGGHHH
EEEnnnnEEEEzzAzffAzzztkkktkkktkHHttHHHHHHHHHHHH444443333EEEEEEEEqqEEEEEEEEjjpppjjHHHHHHttnnnnHHH
HHHEJJEEEEEzAzAffzAzAEtntktttHtHHttHHHHHHHxHxHoooooooooooExExEEEqqEEEEyEqqqqqqqqqqqHHHHtttJJHHHH
HHHHJJEEEEEzzzzffzzzzHnnkkttHHHHHttHHHHHHHHHHHoooooooooooEEEEEEEqqEEEEEEqqqqqqqqqqqHHHHHttJJHHHH
HHHHJJHEKEKzAzAffzAzAHnnkkttHHHHHttHHHHHHHxHxHx4x4x4x3x3xHxExEKEqqKEKHHHyjjpypppyjHHyHHHttJJHHHH
HHHHJJHHHHHzzAzzzAzzzHnnkkttHHHHHttHHHHHHHHHHH44444443333HHHHHHHqqHHHHHHHjjpppppjjHHHHHHtttJHHHH
HHHHJJHHHHHzAzAzAzAzAHnnkkttHHHHHttHHHHHHHxHxHx4x4x4x3x3xHxHxHHHqqHHHHyHHjypppypjjyHHHHHHtttHHHH
HHHHJJHHHHHHzzzzzzzzHHnnkkttHHHHHttHHHHHHHHHHH44444443333HHHHHHHqqHHHHHHHjjpppppjjHHHHHHHHttHHHH
HHHHJJHHHHHHAzAzAzAHAHnnkkttHHHHHttHHHHHHHxHx4x4x4x4x3x3x3xHxHHHqqHHHHHHyjjpypppyjjHyHHHHHttHHHH
HHHHJJHHHHHHHAzzzAHHHHnnkkttHHHHHttHHHHHHHHHH4444444433333HHHHHHqqHHHHHHjjjpppppjjjHHHHHHHtttHHH
HHHHJJHHHHHHAHAzAHAHAHnnkkttHHHoooooHHHHHHxHx4x4x4x4x3x3x3xHxHHHqqHHHHyHjjypppypjjyHHHHHHHJttHHH
HHHHJJHHHHHHHHHHHHHHHHnnkkttHHHoooooHHHHHHHH444444444333333HHHHHqqHHHHHHjjjpppppjjjHHHHHHHJttHHH
HHHHJJHHHHHHHHHHHHHHHHnnkkttHHHHHqqHHHHHHHxHx4x4x4x4x3x3x3xHxHHHqqHHHHHjyjppypppyjjjyHHHHHJJHHHH
HHHHJJHHHHHHHHHHHHHHHHnnkkttHHHHHqqHHHHHHHHH444444444333333HHHHHqqHHHHHjjjpppppppjjjHHHHHHJJHHHH
HHHHJJHHHHHHHHHHHHHHHHnnkkttHHHHHqqHHHHHHHx4x4x4x4x4x3x3x3x3xHHHqqHHHHyjjjypppyppjyjHHHHHHJJHHHH
HHHHJJHHHHHHHHHHHHHHHHnnkkttHHHHHqqHHHHHHHH44444444443333333HHHHqqHHHHHjjjpppppppjjjHHHHHHJJHHHH
HHHHJJHHHHHHHHHHHHHHHnnnnnnnnHHHHHHHHHHHHHx4x4x4x4x4x3x3x3x3xHHHqqHHHHjjyjppypppyjjjyHHHHHJJHHHH
HHHHJJHHHHHHHHHHHHHHHnnnnnnnnHHHHHHHHHHHHH4444444444433333333HHHqqHHHHjjjjpppppppjjjjHHHHHJJHHHH
LLLLJJLLLLLLLLLLLLLLLnnnnpnnnLLLLLLLLLLLLLxoooooooopooooooooxLLLqqLLLLqqqqqqppyqqqqqqLLLLLJJLLLL
MMMMJJMMMMMMMMMMMMpppppppppppppppMMMMMMMMM4opppppppppppppppo3MMMqqMMMMpppppppppppppppMMMMMJJMMMM
pNNNJJNNOpNNONNNpppppppppppppppppppNpNNNONpppppppppppppppppppNNpqqNNpppppppppppppppppppNONJJONNN
pNNNNNNNNpNNNNNNNNpppppppppppppppNNNpNNNNNNNpppppppppppppppNNNNpqqNNNNpppppppppppppppNNNNNpNNNNN
pNONONONOpONONONONpNONONOpOpONONONONpNONONONOpONONOpONpNONONONOpONONONONpNONOpONOpONONONONpNONON
pNNONNNONpNONNNONNpONNNONNNpNNNONNNOpNNONNNONpNONNNONNpONNNONNNpNNNONNNOpNNONNNONpNONNNONNpONNNO
pNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONON
pONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONO
pNOOONOOOpOOONOOONpOONOOONOpONOOONOOpNOOONOOOpOOONOOONpOONOOONOpONOOONOOpNOOONOOOpOOONOOONpOONOO
pONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONONONpNONONONOpONONO
pOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOO
pONOOONOOpNOOONOOOpOOONOOONpOONOOONOpONOOONOOpNOOONOOOpOOONOOONpOONOOONOpONOOONOOpNOOONOOOpOOONO
pOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOO
pOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOOOOOpOOOOO
`, {
    palette: ["#0a0a30", "#2e2ea0", "#d0d0ff", "#d055e0", "#8a1a9a", "#4a4ac8", "#0d0d42", "#ffe9a0", "#d8d49a", "#c9c490", "#f6f2c4", "#ff6a6a", "#55ffff", "#b01a1a", "#ffffff", "#ffffff", "#4a4ac8", "#c9c490", "#12125a", "#4e535c", "#a0a7b2", "#2e2ea0", "#f6f2c4", "#555a63", "#ffd84a", "#0b0b12", "#7a4a22", "#f0a080", "#c47860", "#e6eaee", "#ffc8a8", "#000000", "#191970", "#5a0e68", "#6a6e78", "#2a4ab8", "#6a8af0", "#e6eaee", "#ffb02a", "#ffe36a", "#222288", "#ff6a1a", "#c81e1e", "#14304f", "#a8723a", "#6a4628", "#2e2ea0", "#8f959e", "#5c626b", "#6a4628", "#3a2412", "#6a6ad0", "#6a6a9a", "#4a4a9a"],
    paletteGiorno: ["#3a7bd5", "#4a8be0", "#5e9ee8", "#d055e0", "#8a1a9a", "#4a8be0", "#4a8be0", "#8cc2f2", "#4a8be0", "#4a8be0", "#4a8be0", "#ff6a6a", "#55ffff", "#b01a1a", "#74b0ee", "#ffffff", "#5e9ee8", "#5e9ee8", "#5e9ee8", "#4e535c", "#a0a7b2", "#5e9ee8", "#5e9ee8", "#555a63", "#ffd84a", "#0b0b12", "#7a4a22", "#f0a080", "#c47860", "#e6eaee", "#ffc8a8", "#000000", "#74b0ee", "#5a0e68", "#6a6e78", "#2a4ab8", "#6a8af0", "#e6eaee", "#ffb02a", "#ffe36a", "#8cc2f2", "#ff6a1a", "#c81e1e", "#4a7a9a", "#a8723a", "#6a4628", "#a6d2f6", "#a4aab4", "#707680", "#6a4628", "#3a2412", "#74b0ee", "#8cc2f2", "#5e9ee8"],
    cicli: [{ indici: [14, 51], ritardoMs: 900 }, { indici: [7, 52], ritardoMs: 1300 }, { indici: [2, 53], ritardoMs: 700 }, { indici: [42, 41, 38, 39], ritardoMs: 130 }],
  }),
];
