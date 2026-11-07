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
01050588889995010106060aaaaa06060606060606060607044433060606060606060606060606060606060606060606
165658b8b88956561666666aaaaa666666666666666666664444333666666666c6666666666666666666666666666666
060508888888050106060606ddd60606e60606060606060644443336060606ccccc60606060606060606060606060606
155688b8b888855616166666ddd6666666666666666666644444333366666cfffccc6666666666666666e66666666666
616569888888656161666666ddd6666666666666666666644444333366666cfffccc6666666666666666666666666666
16569998b898565616g666g6ddd666g666g666g666g666444444333336g6ccfffcccceg666g66hg666g666g666g666g6
6665698889996561667666iiiiiii66666666666666666444444333336666ccccccc666666hhhhhhh666666666666666
16165556859655161777giiiiiiiiig6g6g6g6g6g6g6g4444444333333g6gcccccccg6g6ghhhhhhhhhg6g6g676g6g6g6
61616565656561616g7g6jjjjjjjjj6g6g6g6g6g6g6kkkkkkkkkkkkkkkkk6gcccccg6g6ghhhhhlhhhhhg6g6g6g6g6g6g
161g165g565g161g16gggjjllllljjggg6ggg6ggg6gkkkkkkkkkkkkkkkkkg6ggcmggg6gghhhlllllhhhgg6ggg6ggg6gg
6g616g616g616g616g6gijjjjjjjjjig6g6g6g6g6g6g6g6gnnnnnnng6g6g6g6gmm6g6g6ghhlllolllhhg6g6g6g6g6g6g
gg1g1g1g1g1g1g1ggggggjjjjjjjjjgggppgggggggggggggqrrnrrqgggggggggmmggggghhhlooooolhhheggggggggggg
ggggg1g1g1g1gggggggggiiiiiiiiigggppggggggggggggnnnnnnnnnggggggggmmgggggghllkkokkllhggggggggggggg
ggsgggse1gsgggsgggsggiiiiiiiiisggppgggsgggsgggsgqnqnqnqgggsgggsgmmsgggsghhooooooohhgegsgggsgggsg
ggggggggggggggggggggggiiiiiiiggggppgggggggggggggnnnnnnngggggg7ggmmgggggghhlooooolhheeegg7ggggggg
sgsgsgsgsgsgsgsgsgsjjipipipipipisppgsgsgsgtgtgtgqnqnqnqgtgtgtgsgmmsgsgsguhhooooohhsgugsgsgsgsgsg
gsgsgsgsgsgsgsgsgsgjjpiiipiiipisgppsgsgsgsgsgsgsgsgngsgsgsgsgsgsmmgsgsgsgshhhohhhsgsgsgsgsgsgsgs
sgsssgsssgsvwvwvwvwvwipipipipipssppssgsssgtstgxxxxxxxxxxxgtstgssmmsssgussgusshussgussgsssgsssgss
gsgsysgsgsgvvvvvvvvvviiiiiiiiiisgppsgsgsgsgsgsgxxxxxxxxxgsgsgsgsmmgsgsgsgsgsglgsgeeegsgsgsysgsgs
ssszzzsssssvwvwffvwvwipipipipipssppssssssstststsxxxxxxxstststsssmmssssssusssulhsusesusssszzzssss
ssszzzsssssvvwvffwvvvpiiipiiipissppsssssssssssssxxxxxxxsssssssssmmsssssssssshlhsssssssssszzzssss
ssAyyyAsssAvwvwffvwvwipipipipipssppsssAssststststxxxxxtstststsAsmmAsssusssushlusssusssAssyyyssAs
sssyyysssssvvvvffvvvviiiiiiiiiissppssssssssssssssxxxxxssssssssssmmsssssssssshlhssssssssssyyyssss
AsABBBAsAsAvwvwffvwvwipipipipipsAppsAsAsAstststst4xxx3tstststsAsmmAsAsAsusAhullhusAsusAsABBBAsAs
sAsBBBsAsAsvffffffffvpiiipiiipiAsppAsAsAsAsAsAsAs4xxx3sAsAsAsAsAmmsAsAsAsAshlllhsAsAsAsAsBBBsAsA
AsACCCAAAsAvffffffffwmmmmmmmmmmADppDDDDDDDtDtstAt4txt3tAtstAtsAAmmAAAsuAAsuhlluhAsuDDDEEECCCDDAA
sAsCCCsAsAsvvvvffvvvvmmmmmmmmmmDDppDDDDDDDDDDDDA4444333AsAsAsAsAmmsAsAsAsAshlllhDDDDDDEEECCCDDDD
AACCCCCAAAAvwvwffvwvwipipipipipDDppDDDDDDDtDtDtDt4t4t3tAtAtAtAAAmmAAAAAAuAhhullhuDDDuDEEECCCCDDD
AAAjjjjAAAAvvwvffwvvvpiiipiiipiDDppDDDDDDDDDDDD444443333AAAAAAAAmmAAAAAAAAhhlllhhDDDDDDppjjjjDDD
DDDAFFAAAAAvwvwffvwvwApjpipppDpDDppDDDDDDDtDtDkkkkkkkkkkkAtAtAAAmmAAAAuAmmmmmmmmmmmDDDDpppFFDDDD
DDDDFFAAAAAvvvvffvvvvDjjiippDDDDDppDDDDDDDDDDDkkkkkkkkkkkAAAAAAAmmAAAAAAmmmmmmmmmmmDDDDDppFFDDDD
DDDDFFDAGAGvwvwffvwvwDjjiippDDDDDppDDDDDDDtDtDt4t4t4t3t3tDtAtAGAmmGAGDDDuhhlullluhDDuDDDppFFDDDD
DDDDFFDDDDDvvwvvvwvvvDjjiippDDDDDppDDDDDDDDDDD44444443333DDDDDDDmmDDDDDDDhhlllllhhDDDDDDpppFDDDD
DDDDFFDDDDDvwvwvwvwvwDjjiippDDDDDppDDDDDDDtDtDt4t4t4t3t3tDtDtDDDmmDDDDuDDhulllulhhuDDDDDDpppDDDD
DDDDFFDDDDDDvvvvvvvvDDjjiippDDDDDppDDDDDDDDDDD44444443333DDDDDDDmmDDDDDDDhhlllllhhDDDDDDDDppDDDD
DDDDFFDDDDDDwvwvwvwDwDjjiippDDDDDppDDDDDDDtDt4t4t4t4t3t3t3tDtDDDmmDDDDDDuhhlullluhhDuDDDDDppDDDD
DDDDFFDDDDDDDwvvvwDDDDjjiippDDDDDppDDDDDDDDDD4444444433333DDDDDDmmDDDDDDhhhlllllhhhDDDDDDDpppDDD
DDDDFFDDDDDDwDwvwDwDwDjjiippDDDkkkkkDDDDDDtDt4t4t4t4t3t3t3tDtDDDmmDDDDuDhhulllulhhuDDDDDDDFppDDD
DDDDFFDDDDDDDDDDDDDDDDjjiippDDDkkkkkDDDDDDDD444444444333333DDDDDmmDDDDDDhhhlllllhhhDDDDDDDFppDDD
DDDDFFDDDDDDDDDDDDDDDDjjiippDDDDDmmDDDDDDDtDt4t4t4t4t3t3t3tDtDDDmmDDDDDhuhllullluhhhuDDDDDFFDDDD
DDDDFFDDDDDDDDDDDDDDDDjjiippDDDDDmmDDDDDDDDD444444444333333DDDDDmmDDDDDhhhlllllllhhhDDDDDDFFDDDD
DDDDFFDDDDDDDDDDDDDDDDjjiippDDDDDmmDDDDDDDt4t4t4t4t4t3t3t3t3tDDDmmDDDDuhhhulllullhuhDDDDDDFFDDDD
DDDDFFDDDDDDDDDDDDDDDDjjiippDDDDDmmDDDDDDDD44444444443333333DDDDmmDDDDDhhhlllllllhhhDDDDDDFFDDDD
DDDDFFDDDDDDDDDDDDDDDjjjjjjjjDDDDDDDDDDDDDt4t4t4t4t4t3t3t3t3tDDDmmDDDDhhuhllullluhhhuDDDDDFFDDDD
DDDDFFDDDDDDDDDDDDDDDjjjjjjjjDDDDDDDDDDDDD4444444444433333333DDDmmDDDDhhhhlllllllhhhhDDDDDFFDDDD
HHHHFFHHHHHHHHHHHHHHHjjjjljjjHHHHHHHHHHHHHtkkkkkkkklkkkkkkkktHHHmmHHHHmmmmmmllummmmmmHHHHHFFHHHH
IIIIFFIIIIIIIIIIIIlllllllllllllllIIIIIIIII4klllllllllllllllk3IIImmIIIIlllllllllllllllIIIIIFFIIII
lJJJFFJJKlJJKJJJlllllllllllllllllllJlJJJKJlllllllllllllllllllJJlmmJJlllllllllllllllllllJKJFFKJJJ
lJJJJJJJJlJJJJJJJJlllllllllllllllJJJlJJJJJJJlllllllllllllllJJJJlmmJJJJlllllllllllllllJJJJJlJJJJJ
lJKJKJKJKlKJKJKJKJlJKJKJKlKlKJKJKJKJlJKJKJKJKlKJKJKlKJlJKJKJKJKlKJKJKJKJlJKJKlKJKlKJKJKJKJlJKJKJ
lJJKJJJKJlJKJJJKJJlKJJJKJJJlJJJKJJJKlJJKJJJKJlJKJJJKJJlKJJJKJJJlJJJKJJJKlJJKJJJKJlJKJJJKJJlKJJJK
lJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJ
lKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJK
lJKKKJKKKlKKKJKKKJlKKJKKKJKlKJKKKJKKlJKKKJKKKlKKKJKKKJlKKJKKKJKlKJKKKJKKlJKKKJKKKlKKKJKKKJlKKJKK
lKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJKJKJlJKJKJKJKlKJKJK
lKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKK
lKJKKKJKKlJKKKJKKKlKKKJKKKJlKKJKKKJKlKJKKKJKKlJKKKJKKKlKKKJKKKJlKKJKKKJKlKJKKKJKKlJKKKJKKKlKKKJK
lKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKK
lKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKKKKKlKKKKK
`, {
    palette: ["#0a0a30", "#2e2ea0", "#d0d0ff", "#d055e0", "#8a1a9a", "#4a4ac8", "#0d0d42", "#ffe9a0", "#f6f2c4", "#c9c490", "#ff6a6a", "#d8d49a", "#55ffff", "#b01a1a", "#ffffff", "#ffffff", "#12125a", "#4e535c", "#a0a7b2", "#555a63", "#ffd84a", "#0b0b12", "#7a4a22", "#f0a080", "#c47860", "#e6eaee", "#ffc8a8", "#000000", "#191970", "#5a0e68", "#6a6e78", "#2a4ab8", "#6a8af0", "#e6eaee", "#ffb02a", "#ffe36a", "#222288", "#ff6a1a", "#c81e1e", "#14304f", "#a8723a", "#6a4628", "#2e2ea0", "#8f959e", "#5c626b", "#6a4628", "#3a2412", "#6a6ad0", "#6a6a9a", "#4a4a9a"],
    paletteGiorno: ["#3a7bd5", "#8cc2f2", "#5e9ee8", "#d055e0", "#8a1a9a", "#a6d2f6", "#4a8be0", "#8cc2f2", "#f4f6ff", "#c4cce0", "#ff6a6a", "#d8e0f0", "#55ffff", "#b01a1a", "#74b0ee", "#ffffff", "#5e9ee8", "#4e535c", "#a0a7b2", "#555a63", "#ffd84a", "#0b0b12", "#7a4a22", "#f0a080", "#c47860", "#e6eaee", "#ffc8a8", "#000000", "#74b0ee", "#5a0e68", "#6a6e78", "#2a4ab8", "#6a8af0", "#e6eaee", "#ffb02a", "#ffe36a", "#8cc2f2", "#ff6a1a", "#c81e1e", "#4a7a9a", "#a8723a", "#6a4628", "#a6d2f6", "#a4aab4", "#707680", "#6a4628", "#3a2412", "#74b0ee", "#8cc2f2", "#5e9ee8"],
    cicli: [{ indici: [14, 47], ritardoMs: 900 }, { indici: [7, 48], ritardoMs: 1300 }, { indici: [2, 49], ritardoMs: 700 }, { indici: [38, 37, 34, 35], ritardoMs: 130 }],
  }),
];
