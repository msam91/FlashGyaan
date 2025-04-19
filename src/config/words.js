// Initialize empty arrays for each letter
window.A_WORDS = [];
window.B_WORDS = [];
window.C_WORDS = [];
window.D_WORDS = [];
window.E_WORDS = [];
window.F_WORDS = [];
window.G_WORDS = [];
window.H_WORDS = [];
window.I_WORDS = [];
window.J_WORDS = [];
window.K_WORDS = [];
window.L_WORDS = [];
window.M_WORDS = [];
window.N_WORDS = [];
window.O_WORDS = [];
window.P_WORDS = [];
window.Q_WORDS = [];
window.R_WORDS = [];
window.S_WORDS = [];
window.T_WORDS = [];
window.U_WORDS = [];
window.V_WORDS = [];
window.W_WORDS = [];
window.X_WORDS = [];
window.Y_WORDS = [];
window.Z_WORDS = [];

// Function to combine all word lists
function combineWordLists() {
    const GRE_WORDS = [
        ...window.A_WORDS,
        ...window.B_WORDS,
        ...window.C_WORDS,
        ...window.D_WORDS,
        ...window.E_WORDS,
        ...window.F_WORDS,
        ...window.G_WORDS,
        ...window.H_WORDS,
        ...window.I_WORDS,
        ...window.J_WORDS,
        ...window.K_WORDS,
        ...window.L_WORDS,
        ...window.M_WORDS,
        ...window.N_WORDS,
        ...window.O_WORDS,
        ...window.P_WORDS,
        ...window.Q_WORDS,
        ...window.R_WORDS,
        ...window.S_WORDS,
        ...window.T_WORDS,
        ...window.U_WORDS,
        ...window.V_WORDS,
        ...window.W_WORDS,
        ...window.X_WORDS,
        ...window.Y_WORDS,
        ...window.Z_WORDS
    ].sort((a, b) => a.word.localeCompare(b.word));

    return GRE_WORDS;
}

// Export the function to get words
window.getGREWords = combineWordLists;

// Export the words array
if (typeof module !== 'undefined' && module.exports) {
    module.exports = combineWordLists();
} else {
    window.greWords = combineWordLists();
} 