# Ruoli di colore: ogni ruolo ha il colore di notte e, se diverso, quello di giorno (None = uguale).
# Le immagini si disegnano con i NOMI dei ruoli; l'esportazione costruisce palette di notte e di giorno con gli stessi indici.
COL = {
    # cielo notturno/diurno, dall'alto verso l'orizzonte
    "cielo0": ("#0a0a30", "#3a7bd5"), "cielo1": ("#0d0d42", "#4a8be0"), "cielo2": ("#12125a", "#5e9ee8"),
    "cielo3": ("#191970", "#74b0ee"), "cielo4": ("#222288", "#8cc2f2"), "cielo5": ("#2e2ea0", "#a6d2f6"),
    "cielo6": ("#3c3cb4", "#c4e2fa"),
    # stelle: due gruppi di colori che si alternano (lampeggio); di giorno scompaiono nel cielo
    "st1": ("#ffffff", "#74b0ee"), "st1b": ("#6a6ad0", "#74b0ee"),
    "st2": ("#ffe9a0", "#8cc2f2"), "st2b": ("#6a6a9a", "#8cc2f2"),
    "st3": ("#d0d0ff", "#5e9ee8"), "st3b": ("#4a4a9a", "#5e9ee8"),
    # luna
    "vap1": ("#eceff4", None), "vap2": ("#9aa0ae", None),
    "luna": ("#f6f2c4", "#f4f6ff"), "luna_o": ("#d8d49a", "#d8e0f0"), "luna_c": ("#c9c490", "#c4cce0"),
    "alone1": ("#4a4ac8", "#a6d2f6"), "alone2": ("#2e2ea0", "#8cc2f2"),
    # tramonto del titolo (uguale di giorno)
    "tr0": ("#14103c", None), "tr1": ("#2a1260", None), "tr2": ("#6a1a80", None), "tr3": ("#b01a58", None),
    "tr4": ("#e8481c", None), "tr5": ("#ff8a22", None), "tr6": ("#ffc23a", None),
    # montagne e boschi lontani
    "monte1": ("#1b2a6b", "#6f86c8"), "monte2": ("#14304f", "#4a7a9a"), "boscolont": ("#0c3a33", "#2a6a50"),
    # verde
    "g0": ("#0b3f1f", "#1a6a30"), "g1": ("#0f5326", "#1f7a38"), "g2": ("#15632f", "#2a8f45"),
    "g3": ("#2f9a47", "#4fc060"), "g4": ("#4adf6a", "#7af090"),
    "pino_o": ("#0a3a20", "#125530"), "pino_s": ("#0e4d2b", "#1a7040"), "pino_m": ("#1f8f45", "#3fb860"), "pino_l": ("#52d36e", "#8af0a0"),
    "tronco_s": ("#3d2812", None), "tronco": ("#5a3a1c", None), "tronco_l": ("#7a5230", None),
    "terra": ("#7a5230", None), "terra_s": ("#5a3a1c", None),
    "fiore_r": ("#ff6b6b", None), "fiore_g": ("#ffd84a", None), "fiore_b": ("#ffffff", None),
    "lucciola": ("#fff27a", "#2a8f45"), "lucciola_b": ("#6a6a2a", "#2a8f45"),
    # pietra, mattoni, malta
    "pietra_s": ("#3a3d46", "#4a4d58"), "pietra": ("#5c626b", "#707680"), "pietra_l": ("#8f959e", "#a4aab4"), "pietra_c": ("#b9bfc7", "#cdd2d9"),
    "mattone_s": ("#7a1f12", "#8a2a1a"), "mattone": ("#a33a1e", "#b8482a"), "mattone_l": ("#c4552d", "#d8683a"), "malta": ("#8a6a4a", "#a8825a"),
    "tetto_s": ("#6a0f0f", "#7a1818"), "tetto": ("#a01818", "#b82a2a"), "tetto_l": ("#d03030", "#e04848"),
    "legno_s": ("#3d2812", None), "legno": ("#6a4628", None), "legno_l": ("#9a6a3a", None),
    # finestre illuminate (di giorno scure) e fuoco
    "fin": ("#ffd84a", "#3a4a6a"), "fin_c": ("#ff9a2a", "#2a3a5a"), "fin_o": ("#1a1a22", "#1a1a22"),
    "f1": ("#7a0a0a", None), "f2": ("#c81e1e", None), "f3": ("#ff6a1a", None), "f4": ("#ffb02a", None), "f5": ("#ffe36a", None), "f6": ("#fff6c0", None),
    # metalli
    "acc_s": ("#555a63", None), "acc": ("#a0a7b2", None), "acc_l": ("#e6eaee", None),
    "oro_s": ("#c9a020", None), "oro": ("#ffd84a", None), "oro_l": ("#fff0a0", None),
    # stoffe e pelle
    "viola_s": ("#5a0e68", None), "viola": ("#8a1a9a", None), "viola_l": ("#d055e0", None),
    "blu_s": ("#1a2a78", None), "blu": ("#2a4ab8", None), "blu_l": ("#6a8af0", None),
    "rosso_s": ("#7a0e0e", None), "rosso": ("#b01a1a", None), "rosso_l": ("#ff6a6a", None),
    "marr_s": ("#4a2c14", None), "marr": ("#7a4a22", None), "marr_l": ("#a8723a", None),
    "ver_s": ("#145a2a", None), "ver": ("#2a9a48", None), "ver_l": ("#7ae09a", None),
    "cian": ("#55ffff", None), "cian_s": ("#1a9aa8", None), "rosa": ("#ff8ab8", None),
    "pelle_s": ("#c47860", None), "pelle": ("#f0a080", None), "pelle_l": ("#ffc8a8", None),
    "pelo_s": ("#4e535c", None), "pelo": ("#8a909a", None), "pelo_l": ("#c9cfd6", None), "pelo_c": ("#e6eaee", None),
    "ts1": ("#ffffff", None), "ts1b": ("#6a6ad0", None), "ts2": ("#ffe9a0", None), "ts2b": ("#6a6a9a", None),
    "ts3": ("#d0d0ff", None), "ts3b": ("#4a4a9a", None), "tluna": ("#f6f2c4", None), "tluna_o": ("#d8d49a", None),
    "tfin": ("#ffd84a", None), "tfin_c": ("#ff9a2a", None),
    # mappa della città (pergamena; non cambiano con il giorno)
    "perg": ("#d8c598", None), "perg_s": ("#b8a06a", None), "perg_l": ("#ecdfbc", None), "inchiostro": ("#3a2a18", None),
    "acqua": ("#4a7ab8", None), "acqua_l": ("#8ab0e0", None), "acq_a": ("#b4d6f4", None), "acq_b": ("#4a7ab8", None), "collina": ("#a8925a", None), "collina_s": ("#80693a", None),
    "mp_aperta": ("#ffd84a", None), "mp_chiusa": ("#8a8a8a", None), "mk1": ("#ff2a2a", None), "mk2": ("#ffffff", None),
    "nero": ("#000000", None), "bianco": ("#ffffff", None), "outline": ("#1b1d22", None),
    "grigio": ("#6a6e78", None), "ombra": ("#0b0b12", None),
    # interni caldi
    "muro_s": ("#2e2420", None), "muro": ("#4a3a30", None), "muro_l": ("#6a5444", None),
    "pavim_s": ("#3a2412", None), "pavim": ("#6a4628", None), "pavim_l": ("#8a5c30", None),
    "vetro": ("#9ad8ff", None), "erba_g": ("#3a9a5a", None),
}
