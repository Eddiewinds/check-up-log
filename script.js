/**
 * Check up log
 * Vanilla JavaScript application with localStorage persistence
 */

(function () {
  'use strict';

  // --- STORAGE & STATE ---
  const STORAGE_KEY = 'check_up_log_v1';
  const LEGACY_STORAGE_KEY = 'moms' + '_daily_health_log_v1';
  const THEME_STORAGE_KEY = 'checkup-log-theme';
  let healthEntries = [];
  let pendingDeleteId = null;
  let isFormOpen = false;

  // --- DOM ELEMENTS ---
  const totalCountEl = document.getElementById('totalCount');
  const toggleFormBtn = document.getElementById('toggleFormBtn');
  const toggleFormBtnText = document.getElementById('toggleFormBtnText');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const entryFormSection = document.getElementById('entryFormSection');
  const closeFormBtn = document.getElementById('closeFormBtn');
  const healthForm = document.getElementById('healthForm');
  const editingIdInput = document.getElementById('editingId');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const saveBtnText = document.getElementById('saveBtnText');
  const cancelFormBtn = document.getElementById('cancelFormBtn');

  // Form Fields
  const entryDateInput = document.getElementById('entryDate');
  const bloodSugarInput = document.getElementById('bloodSugar');
  const bpRightSysInput = document.getElementById('bpRightSystolic');
  const bpRightDiaInput = document.getElementById('bpRightDiastolic');
  const bpRightPulseInput = document.getElementById('bpRightPulse');
  const bpLeftSysInput = document.getElementById('bpLeftSystolic');
  const bpLeftDiaInput = document.getElementById('bpLeftDiastolic');
  const bpLeftPulseInput = document.getElementById('bpLeftPulse');
  const medicationYesRadio = document.getElementById('medicationYes');
  const medicationNoRadio = document.getElementById('medicationNo');
  const medicationAmountInput = document.getElementById('medicationAmount');
  const medicationAmountField = document.getElementById('medicationAmountField');
  const mealMorningInput = document.getElementById('mealMorning');
  const mealAfternoonInput = document.getElementById('mealAfternoon');
  const mealEveningInput = document.getElementById('mealEvening');

  // Search & List
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const entriesList = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');
  const emptyMessage = document.getElementById('emptyMessage');
  const emptyAddBtn = document.getElementById('emptyAddBtn');
  const showingCountText = document.getElementById('showingCountText');
  const loadSampleBtn = document.getElementById('loadSampleBtn');

  // Modal & Toast
  const deleteModal = document.getElementById('deleteModal');
  const deleteModalBody = document.getElementById('deleteModalBody');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const toastNotice = document.getElementById('toastNotice');
  const toastIcon = document.getElementById('toastIcon');
  const toastMsg = document.getElementById('toastMsg');

  let toastTimeout = null;

  // --- INITIALIZATION ---
  function init() {
    initTheme();
    loadEntriesFromStorage();
    setTodayDateDefault();
    setupEventListeners();
    render();

    // If no entries exist yet, open the form so the user can start logging immediately.
    // Otherwise keep it collapsed so recent history is visible first.
    if (healthEntries.length === 0) {
      openForm(false);
    } else {
      closeForm();
    }
  }

  // --- THEME (LIGHT / DARK MODE) ---
  function getActiveTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function updateThemeToggleUI(theme) {
    if (!themeToggleBtn || !themeIcon) return;
    if (theme === 'dark') {
      themeIcon.textContent = '☀️';
      themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
      themeToggleBtn.title = 'Switch to light mode';
    } else {
      themeIcon.textContent = '🌙';
      themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
      themeToggleBtn.title = 'Switch to dark mode';
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }
    updateThemeToggleUI(theme);
  }

  function toggleTheme() {
    const current = getActiveTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }

  function initTheme() {
    let currentTheme = 'light';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        currentTheme = saved;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme = 'dark';
      }
    } catch (e) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        currentTheme = 'dark';
      }
    }

    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeToggleUI(currentTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Follow system changes if user hasn't explicitly set a preference
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        try {
          const saved = localStorage.getItem(THEME_STORAGE_KEY);
          if (!saved) {
            const systemTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', systemTheme);
            updateThemeToggleUI(systemTheme);
          }
        } catch (err) {}
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSystemThemeChange);
      }
    }
  }

  // --- DATE HELPERS ---
  function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setTodayDateDefault() {
    if (!entryDateInput.value) {
      entryDateInput.value = getTodayDateString();
    }
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return 'Unknown Date';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        return d.toLocaleDateString('en-US', options);
      }
    } catch (e) {
      console.error('Date parse error', e);
    }
    return dateStr;
  }

  function getRelativeDayLabel(dateStr) {
    const today = getTodayDateString();
    if (dateStr === today) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (dateStr === yStr) return 'Yesterday';

    return null;
  }

  // --- INTERPRETATION ENGINE ---
  /**
   * Blood Sugar standard fasting ranges (mg/dL)
   * < 70: Low (Warning)
   * 70 - 99: Normal (Green)
   * 100 - 125: Elevated (Yellow)
   * >= 126: High (Red)
   */
  function interpretBloodSugar(val) {
    if (val === null || val === undefined || isNaN(val) || val === '') {
      return null;
    }
    const num = Number(val);
    if (num < 70) {
      return {
        status: 'Low',
        level: 'low',
        colorClass: 'interp-yellow',
        pillClass: 'status-yellow',
        emoji: '🟡',
        summary: 'Low Blood Sugar (<70 mg/dL)',
        advice: 'Below standard fasting range. Consider a light snack or fruit juice if feeling weak.'
      };
    } else if (num <= 99) {
      return {
        status: 'Normal',
        level: 'normal',
        colorClass: 'interp-green',
        pillClass: 'status-green',
        emoji: '🟢',
        summary: 'Normal Blood Sugar (70–99 mg/dL)',
        advice: 'Healthy fasting target range.'
      };
    } else if (num <= 125) {
      return {
        status: 'Elevated',
        level: 'elevated',
        colorClass: 'interp-yellow',
        pillClass: 'status-yellow',
        emoji: '🟡',
        summary: 'Elevated Blood Sugar (100–125 mg/dL)',
        advice: 'Slightly above normal fasting target (pre-diabetes range).'
      };
    } else {
      return {
        status: 'High',
        level: 'high',
        colorClass: 'interp-red',
        pillClass: 'status-red',
        emoji: '🔴',
        summary: 'High Blood Sugar (≥126 mg/dL)',
        advice: 'High fasting blood sugar. Keep track and consult your healthcare provider.'
      };
    }
  }

  /**
   * Blood Pressure interpretation based on AHA guidelines
   * Normal: Sys < 120 and Dia < 80
   * Elevated: Sys 120-129 and Dia < 80
   * High: Sys >= 130 or Dia >= 80
   * Low: Sys < 90 or Dia < 60
   */
  function interpretBloodPressureArm(systolic, diastolic) {
    if (!systolic && !diastolic) return null;
    const sys = Number(systolic) || 0;
    const dia = Number(diastolic) || 0;

    if (sys === 0 || dia === 0) return null;

    if (sys < 90 || dia < 60) {
      return {
        status: 'Low BP',
        level: 'low',
        colorClass: 'interp-yellow',
        pillClass: 'status-yellow',
        emoji: '🟡',
        text: 'Low blood pressure (<90/<60)'
      };
    }

    if (sys < 120 && dia < 80) {
      return {
        status: 'Normal',
        level: 'normal',
        colorClass: 'interp-green',
        pillClass: 'status-green',
        emoji: '🟢',
        text: 'Normal blood pressure (<120/80)'
      };
    }

    if (sys >= 120 && sys <= 129 && dia < 80) {
      return {
        status: 'Elevated',
        level: 'elevated',
        colorClass: 'interp-yellow',
        pillClass: 'status-yellow',
        emoji: '🟡',
        text: 'Elevated blood pressure (120-129/<80)'
      };
    }

    return {
      status: 'High',
      level: 'high',
      colorClass: 'interp-red',
      pillClass: 'status-red',
      emoji: '🔴',
      text: 'High blood pressure (≥130 or ≥80)'
    };
  }

  /**
   * Overall blood pressure interpretation
   */
  function evaluateOverallBP(rightSys, rightDia, leftSys, leftDia) {
    const rInterp = interpretBloodPressureArm(rightSys, rightDia);
    const lInterp = interpretBloodPressureArm(leftSys, leftDia);

    const severityMap = { high: 3, elevated: 2, low: 1, normal: 0 };
    let primary = rInterp || lInterp;

    if (rInterp && lInterp) {
      const rScore = severityMap[rInterp.level] || 0;
      const lScore = severityMap[lInterp.level] || 0;
      primary = rScore >= lScore ? rInterp : lInterp;
    }

    // Check Arm Differences (> 10 points on systolic or diastolic)
    let armDiffAlert = null;
    if (rightSys && leftSys) {
      const sysDiff = Math.abs(Number(rightSys) - Number(leftSys));
      const diaDiff = (rightDia && leftDia) ? Math.abs(Number(rightDia) - Number(leftDia)) : 0;

      if (sysDiff > 10 || diaDiff > 10) {
        armDiffAlert = {
          flagged: true,
          sysDiff: sysDiff,
          diaDiff: diaDiff,
          message: `Right and Left arms differ by more than 10 points (Systolic diff: ${sysDiff} mmHg${diaDiff > 0 ? `, Diastolic diff: ${diaDiff} mmHg` : ''}).`
        };
      } else {
        armDiffAlert = {
          flagged: false,
          sysDiff: sysDiff,
          diaDiff: diaDiff,
          message: `Arms match closely (Systolic diff: ${sysDiff} mmHg).`
        };
      }
    }

    return {
      armRight: rInterp,
      armLeft: lInterp,
      overall: primary,
      armDiff: armDiffAlert
    };
  }

  // --- LOCAL STORAGE OPERATIONS ---
  function loadEntriesFromStorage() {
    try {
      let data = localStorage.getItem(STORAGE_KEY);
      // Migrate from legacy storage key if present
      if (!data) {
        const oldData = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (oldData) {
          data = oldData;
          localStorage.setItem(STORAGE_KEY, oldData);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
      if (data) {
        healthEntries = JSON.parse(data);
        if (!Array.isArray(healthEntries)) {
          healthEntries = [];
        }
      } else {
        healthEntries = [];
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
      healthEntries = [];
    }
  }

  function saveEntriesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(healthEntries));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      showToast('⚠️ Storage error! Could not save data.', '⚠️');
    }
  }

  // --- FORM OPERATIONS ---
  function resetForm() {
    healthForm.reset();
    editingIdInput.value = '';
    entryDateInput.value = getTodayDateString();
    medicationYesRadio.checked = true;
    medicationAmountInput.value = ''; // Does not force an amount on the user
    medicationAmountField.style.display = 'block';

    formTitle.textContent = 'Add Daily Health Entry';
    formSubtitle.textContent = "Fill in today's numbers and meals below.";
    saveBtnText.textContent = "Save Today's Entry";
    entryFormSection.classList.remove('is-editing');
  }

  function openForm(isEditing = false) {
    isFormOpen = true;
    entryFormSection.style.display = 'block';
    toggleFormBtn.setAttribute('aria-expanded', 'true');
    toggleFormBtnText.textContent = isEditing ? 'Edit' : 'Close';
    toggleFormBtn.classList.toggle('btn-secondary', true);
    toggleFormBtn.classList.toggle('btn-primary', false);

    if (!isEditing) {
      resetForm();
    }
  }

  function closeForm() {
    isFormOpen = false;
    resetForm();
    entryFormSection.style.display = 'none';
    toggleFormBtn.setAttribute('aria-expanded', 'false');
    toggleFormBtnText.textContent = "Add Log";
    toggleFormBtn.classList.toggle('btn-primary', true);
    toggleFormBtn.classList.toggle('btn-secondary', false);
  }

  function toggleForm() {
    if (isFormOpen) {
      closeForm();
    } else {
      openForm(false);
      entryDateInput.focus();
    }
  }

  function populateFormForEdit(entry) {
    openForm(true);
    entryFormSection.classList.add('is-editing');
    editingIdInput.value = entry.id;
    formTitle.textContent = `Edit Health Entry (${formatDisplayDate(entry.date)})`;
    formSubtitle.textContent = 'Modify any readings or meals, then click Update below.';
    saveBtnText.textContent = 'Update Entry';

    entryDateInput.value = entry.date || '';
    bloodSugarInput.value = entry.bloodSugar !== null && entry.bloodSugar !== undefined ? entry.bloodSugar : '';
    bpRightSysInput.value = entry.bpRightSystolic || '';
    bpRightDiaInput.value = entry.bpRightDiastolic || '';
    bpRightPulseInput.value = entry.bpRightPulse || '';
    bpLeftSysInput.value = entry.bpLeftSystolic || '';
    bpLeftDiaInput.value = entry.bpLeftDiastolic || '';
    bpLeftPulseInput.value = entry.bpLeftPulse || '';

    const medTaken = (entry.medicationTaken || entry.doseTaken) === 'no';
    if (medTaken) {
      medicationNoRadio.checked = true;
      medicationAmountField.style.display = 'none';
      medicationAmountInput.value = '';
    } else {
      medicationYesRadio.checked = true;
      medicationAmountField.style.display = 'block';
      medicationAmountInput.value = entry.medicationAmount || entry.doseAmount || '';
    }

    mealMorningInput.value = entry.mealMorning || '';
    mealAfternoonInput.value = entry.mealAfternoon || '';
    mealEveningInput.value = entry.mealEvening || '';

    entryFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- SUBMIT HANDLER ---
  function handleFormSubmit(e) {
    e.preventDefault();

    const dateVal = entryDateInput.value;
    if (!dateVal) {
      alert('Please select a date for this log entry.');
      entryDateInput.focus();
      return;
    }

    const editingId = editingIdInput.value;
    const isEditing = Boolean(editingId);

    const medicationTaken = medicationYesRadio.checked ? 'yes' : 'no';
    const medicationAmount = medicationTaken === 'yes' ? medicationAmountInput.value.trim() : '';

    const entryData = {
      id: isEditing ? editingId : 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      date: dateVal,
      bloodSugar: bloodSugarInput.value !== '' ? Number(bloodSugarInput.value) : null,
      bpRightSystolic: bpRightSysInput.value !== '' ? Number(bpRightSysInput.value) : null,
      bpRightDiastolic: bpRightDiaInput.value !== '' ? Number(bpRightDiaInput.value) : null,
      bpRightPulse: bpRightPulseInput.value !== '' ? Number(bpRightPulseInput.value) : null,
      bpLeftSystolic: bpLeftSysInput.value !== '' ? Number(bpLeftSysInput.value) : null,
      bpLeftDiastolic: bpLeftDiaInput.value !== '' ? Number(bpLeftDiaInput.value) : null,
      bpLeftPulse: bpLeftPulseInput.value !== '' ? Number(bpLeftPulseInput.value) : null,
      medicationTaken: medicationTaken,
      medicationAmount: medicationAmount,
      mealMorning: mealMorningInput.value.trim(),
      mealAfternoon: mealAfternoonInput.value.trim(),
      mealEvening: mealEveningInput.value.trim(),
      updatedAt: Date.now()
    };

    if (isEditing) {
      const idx = healthEntries.findIndex(item => item.id === editingId);
      if (idx !== -1) {
        healthEntries[idx] = entryData;
        showToast('✓ Entry updated successfully!', '✏️');
      }
    } else {
      entryData.createdAt = Date.now();
      healthEntries.unshift(entryData);
      showToast('✓ Entry saved successfully!', '💾');
    }

    sortEntriesNewestFirst();
    saveEntriesToStorage();
    render();
    closeForm();
  }

  function sortEntriesNewestFirst() {
    healthEntries.sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  }

  // --- DELETE CONFIRMATION ---
  function promptDeleteEntry(id) {
    const entry = healthEntries.find(item => item.id === id);
    if (!entry) return;

    pendingDeleteId = id;
    const formatted = formatDisplayDate(entry.date);
    deleteModalBody.textContent = `Are you sure you want to delete this log entry for ${formatted}? This cannot be undone.`;
    deleteModal.hidden = false;
    confirmDeleteBtn.focus();
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;

    healthEntries = healthEntries.filter(item => item.id !== pendingDeleteId);
    saveEntriesToStorage();
    render();
    closeDeleteModal();
    showToast('Entry deleted.', '🗑️');
  }

  function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteId = null;
  }

  // --- COPY SUMMARY FOR WHATSAPP ---
  function generateWhatsAppSummary(entry) {
    const dateFormatted = formatDisplayDate(entry.date);
    const sugarEval = interpretBloodSugar(entry.bloodSugar);
    const bpEval = evaluateOverallBP(
      entry.bpRightSystolic,
      entry.bpRightDiastolic,
      entry.bpLeftSystolic,
      entry.bpLeftDiastolic
    );

    let lines = [];
    lines.push(`📅 *Check up log* — ${dateFormatted}`);
    lines.push(``);

    // Blood Sugar
    if (entry.bloodSugar !== null && entry.bloodSugar !== undefined) {
      lines.push(`🩸 *Fasting Blood Sugar:* ${entry.bloodSugar} mg/dL (${sugarEval.status} ${sugarEval.emoji})`);
      lines.push(`   _${sugarEval.advice}_`);
    } else {
      lines.push(`🩸 *Fasting Blood Sugar:* Not recorded today`);
    }
    lines.push(``);

    // Blood Pressure
    lines.push(`💪 *Blood Pressure & Pulse:*`);
    const rHasVal = entry.bpRightSystolic || entry.bpRightDiastolic;
    const lHasVal = entry.bpLeftSystolic || entry.bpLeftDiastolic;

    if (rHasVal) {
      const rPulseStr = entry.bpRightPulse ? ` | Pulse: ${entry.bpRightPulse} bpm` : '';
      const rStatus = bpEval.armRight ? ` (${bpEval.armRight.status} ${bpEval.armRight.emoji})` : '';
      lines.push(`• Right Arm: ${entry.bpRightSystolic || '-'}/${entry.bpRightDiastolic || '-'} mmHg${rPulseStr}${rStatus}`);
    } else {
      lines.push(`• Right Arm: Not recorded`);
    }

    if (lHasVal) {
      const lPulseStr = entry.bpLeftPulse ? ` | Pulse: ${entry.bpLeftPulse} bpm` : '';
      const lStatus = bpEval.armLeft ? ` (${bpEval.armLeft.status} ${bpEval.armLeft.emoji})` : '';
      lines.push(`• Left Arm: ${entry.bpLeftSystolic || '-'}/${entry.bpLeftDiastolic || '-'} mmHg${lPulseStr}${lStatus}`);
    } else {
      lines.push(`• Left Arm: Not recorded`);
    }

    // Arm match check
    if (bpEval.armDiff) {
      if (bpEval.armDiff.flagged) {
        lines.push(`• ⚠️ *Arm Alert:* ${bpEval.armDiff.message}`);
      } else {
        lines.push(`• ✅ *Arm Match:* Arms match well (under 10 points difference)`);
      }
    }
    lines.push(``);

    // Medication
    const medTaken = (entry.medicationTaken || entry.doseTaken) === 'yes';
    const medAmount = (entry.medicationAmount !== undefined ? entry.medicationAmount : entry.doseAmount) || '';
    if (medTaken) {
      lines.push(`💊 *Medication:* Taken${medAmount ? ` (${medAmount})` : ''} ✅`);
    } else {
      lines.push(`💊 *Medication:* Not taken ❌`);
    }
    lines.push(``);

    // Meals
    lines.push(`🥗 *Meals:*`);
    lines.push(`• Morning: ${entry.mealMorning ? entry.mealMorning : 'None recorded'}`);
    lines.push(`• Afternoon: ${entry.mealAfternoon ? entry.mealAfternoon : 'None recorded'}`);
    lines.push(`• Evening: ${entry.mealEvening ? entry.mealEvening : 'None recorded'}`);
    lines.push(``);
    lines.push(`ℹ️ _Daily health record. General guidance only._`);

    return lines.join('\n');
  }

  function copySummaryToClipboard(entryId) {
    const entry = healthEntries.find(item => item.id === entryId);
    if (!entry) return;

    const summaryText = generateWhatsAppSummary(entry);

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(summaryText)
        .then(() => {
          showToast('✓ Summary copied! Ready to paste into WhatsApp.', '📋');
        })
        .catch(() => {
          fallbackCopyText(summaryText);
        });
    } else {
      fallbackCopyText(summaryText);
    }
  }

  function fallbackCopyText(text) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        showToast('✓ Summary copied! Ready to paste into WhatsApp.', '📋');
      } else {
        prompt('Copy your summary manually below (Ctrl+C / Cmd+C):', text);
      }
    } catch (err) {
      prompt('Copy your summary manually below (Ctrl+C / Cmd+C):', text);
    }
  }

  // --- TOAST NOTIFICATION ---
  function showToast(message, icon = '📋') {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastMsg.textContent = message;
    toastIcon.textContent = icon;
    toastNotice.hidden = false;

    toastTimeout = setTimeout(() => {
      toastNotice.hidden = true;
    }, 3800);
  }

  // --- SEARCH & FILTER ---
  function getFilteredEntries() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      return healthEntries;
    }

    return healthEntries.filter(entry => {
      const dateMatch = entry.date && entry.date.toLowerCase().includes(query);
      const displayDateMatch = formatDisplayDate(entry.date).toLowerCase().includes(query);
      const morningMatch = entry.mealMorning && entry.mealMorning.toLowerCase().includes(query);
      const afternoonMatch = entry.mealAfternoon && entry.mealAfternoon.toLowerCase().includes(query);
      const eveningMatch = entry.mealEvening && entry.mealEvening.toLowerCase().includes(query);
      const medMatch = (entry.medicationAmount && entry.medicationAmount.toLowerCase().includes(query)) ||
                       (entry.doseAmount && entry.doseAmount.toLowerCase().includes(query));

      return dateMatch || displayDateMatch || morningMatch || afternoonMatch || eveningMatch || medMatch;
    });
  }

  // --- RENDER FUNCTION ---
  function render() {
    const total = healthEntries.length;
    totalCountEl.textContent = total;

    const filtered = getFilteredEntries();
    const query = searchInput.value.trim();

    clearSearchBtn.hidden = !query;

    if (query) {
      showingCountText.textContent = `Found ${filtered.length} of ${total} entries matching "${query}"`;
    } else {
      showingCountText.textContent = total === 1 ? 'Showing 1 entry (newest first)' : `Showing ${total} entries (newest first)`;
    }

    if (filtered.length === 0) {
      entriesList.innerHTML = '';
      emptyState.hidden = false;

      if (total === 0) {
        emptyMessage.textContent = "You haven't logged any health readings yet. Tap the button below to record your first day!";
        emptyAddBtn.hidden = false;
        loadSampleBtn.style.display = 'inline-block';
      } else {
        emptyMessage.textContent = `No health records found matching "${query}". Try searching another food or date!`;
        emptyAddBtn.hidden = true;
      }
      return;
    }

    emptyState.hidden = true;
    if (total > 0) {
      loadSampleBtn.style.display = 'none';
    }

    let html = '';
    filtered.forEach(entry => {
      html += createEntryCardHtml(entry);
    });

    entriesList.innerHTML = html;
  }

  function createEntryCardHtml(entry) {
    const dateFormatted = formatDisplayDate(entry.date);
    const relTag = getRelativeDayLabel(entry.date);
    const sugarEval = interpretBloodSugar(entry.bloodSugar);
    const bpEval = evaluateOverallBP(
      entry.bpRightSystolic,
      entry.bpRightDiastolic,
      entry.bpLeftSystolic,
      entry.bpLeftDiastolic
    );

    let statusPillsHtml = '';

    if (sugarEval) {
      statusPillsHtml += `
        <span class="status-pill ${sugarEval.pillClass}">
          <span>Sugar: ${sugarEval.status}</span> ${sugarEval.emoji}
        </span>
      `;
    }

    if (bpEval.overall) {
      statusPillsHtml += `
        <span class="status-pill ${bpEval.overall.pillClass}">
          <span>BP: ${bpEval.overall.status}</span> ${bpEval.overall.emoji}
        </span>
      `;
    }

    if (bpEval.armDiff && bpEval.armDiff.flagged) {
      statusPillsHtml += `
        <span class="status-pill status-red">
          <span>Arm Diff >10</span> ⚠️
        </span>
      `;
    }

    // Fasting Sugar Block
    let sugarBlock = '';
    if (entry.bloodSugar !== null && entry.bloodSugar !== undefined) {
      sugarBlock = `
        <div class="metric-panel">
          <div class="metric-panel-title">
            <span>🩸 Fasting Blood Sugar</span>
            <span class="status-pill ${sugarEval.pillClass}">${sugarEval.status}</span>
          </div>
          <div class="reading-highlight">
            <span class="reading-val">${entry.bloodSugar}</span>
            <span class="reading-unit">mg/dL</span>
          </div>
          <div class="reading-interpretation ${sugarEval.colorClass}">
            ${sugarEval.emoji} ${sugarEval.advice}
          </div>
        </div>
      `;
    } else {
      sugarBlock = `
        <div class="metric-panel">
          <div class="metric-panel-title">
            <span>🩸 Fasting Blood Sugar</span>
          </div>
          <p class="meal-empty">Not measured today</p>
        </div>
      `;
    }

    // Blood Pressure Block
    const hasRight = entry.bpRightSystolic || entry.bpRightDiastolic;
    const hasLeft = entry.bpLeftSystolic || entry.bpLeftDiastolic;

    let armDiffAlertHtml = '';
    if (bpEval.armDiff) {
      if (bpEval.armDiff.flagged) {
        armDiffAlertHtml = `
          <div class="arm-difference-alert" role="alert">
            <span style="font-size: 1.4rem;">⚠️</span>
            <div>
              <strong>Arm Difference Notice (>10 points)</strong>
              <span>${bpEval.armDiff.message} Doctors recommend asking your healthcare provider about persistent differences between arms.</span>
            </div>
          </div>
        `;
      } else {
        armDiffAlertHtml = `
          <p class="field-help mt-2" style="color: #15803d; font-weight: 600;">
            ✅ Arms match well (within 10 mmHg systolic difference).
          </p>
        `;
      }
    }

    const bpBlock = `
      <div class="metric-panel">
        <div class="metric-panel-title">
          <span>💪 Blood Pressure & Pulse</span>
          ${bpEval.overall ? `<span class="status-pill ${bpEval.overall.pillClass}">${bpEval.overall.status}</span>` : ''}
        </div>

        <div class="bp-arms-detail">
          <div class="arm-stat-row">
            <span class="arm-stat-label">👉 Right Arm:</span>
            <span class="arm-stat-value">
              ${hasRight ? `${entry.bpRightSystolic || '-'} / ${entry.bpRightDiastolic || '-'} mmHg` : '<span class="meal-empty">Not taken</span>'}
              ${entry.bpRightPulse ? `<span class="arm-stat-pulse">(${entry.bpRightPulse} bpm)</span>` : ''}
            </span>
          </div>

          <div class="arm-stat-row">
            <span class="arm-stat-label">👈 Left Arm:</span>
            <span class="arm-stat-value">
              ${hasLeft ? `${entry.bpLeftSystolic || '-'} / ${entry.bpLeftDiastolic || '-'} mmHg` : '<span class="meal-empty">Not taken</span>'}
              ${entry.bpLeftPulse ? `<span class="arm-stat-pulse">(${entry.bpLeftPulse} bpm)</span>` : ''}
            </span>
          </div>
        </div>

        ${armDiffAlertHtml}
      </div>
    `;

    // Medication Information
    const medTaken = (entry.medicationTaken || entry.doseTaken) === 'yes';
    const medAmount = (entry.medicationAmount !== undefined ? entry.medicationAmount : entry.doseAmount) || '';
    const medHtml = medTaken
      ? `<span class="medication-status-tag" style="color: #15803d;">✅ Taken${medAmount ? ` (${escapeHtml(medAmount)})` : ''}</span>`
      : `<span class="medication-status-tag" style="color: #dc2626;">❌ Not Taken</span>`;

    // Meals Breakdown
    const morningMeal = entry.mealMorning ? escapeHtml(entry.mealMorning) : '<span class="meal-empty">Nothing logged</span>';
    const afternoonMeal = entry.mealAfternoon ? escapeHtml(entry.mealAfternoon) : '<span class="meal-empty">Nothing logged</span>';
    const eveningMeal = entry.mealEvening ? escapeHtml(entry.mealEvening) : '<span class="meal-empty">Nothing logged</span>';

    return `
      <article class="entry-card card" id="card-${entry.id}">
        <!-- Top header with Date & Badges -->
        <header class="entry-card-header">
          <div class="entry-date-badge">
            <span class="date-calendar-icon" aria-hidden="true">📅</span>
            <div>
              <h3 class="date-title">${dateFormatted}</h3>
              ${relTag ? `<span class="date-relative">(${relTag})</span>` : ''}
            </div>
          </div>

          <div class="entry-status-pills">
            ${statusPillsHtml}
          </div>
        </header>

        <!-- Metrics Grid (Sugar & Pressure) -->
        <div class="entry-metrics-grid">
          ${sugarBlock}
          ${bpBlock}
        </div>

        <!-- Medication Info -->
        <div class="entry-medication-box">
          <span style="font-weight: 700; color: var(--text-main);">💊 Medication:</span>
          ${medHtml}
        </div>

        <!-- Meals Card -->
        <div class="entry-meals-card">
          <div class="meals-card-heading">
            <span>🥗 What Was Eaten</span>
          </div>
          <ul class="meals-list">
            <li class="meal-item">
              <span class="meal-time-tag">🌅 Morning:</span>
              <span class="meal-content">${morningMeal}</span>
            </li>
            <li class="meal-item">
              <span class="meal-time-tag">☀️ Afternoon:</span>
              <span class="meal-content">${afternoonMeal}</span>
            </li>
            <li class="meal-item">
              <span class="meal-time-tag">🌙 Evening:</span>
              <span class="meal-content">${eveningMeal}</span>
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <footer class="entry-actions">
          <button 
            type="button" 
            class="btn btn-whatsapp btn-whatsapp-copy" 
            data-action="copy" 
            data-id="${entry.id}"
            title="Copy formatted daily summary to send on WhatsApp"
          >
            <span class="btn-icon">📋</span>
            <span>Copy Summary for WhatsApp</span>
          </button>

          <button 
            type="button" 
            class="btn btn-secondary btn-card-edit" 
            data-action="edit" 
            data-id="${entry.id}"
            title="Edit this entry"
          >
            <span class="btn-icon">✏️</span>
            <span>Edit</span>
          </button>

          <button 
            type="button" 
            class="btn btn-danger btn-card-delete" 
            data-action="delete" 
            data-id="${entry.id}"
            title="Delete this entry"
          >
            <span class="btn-icon">🗑️</span>
            <span>Delete</span>
          </button>
        </footer>
      </article>
    `;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    toggleFormBtn.addEventListener('click', toggleForm);
    closeFormBtn.addEventListener('click', closeForm);
    cancelFormBtn.addEventListener('click', closeForm);
    emptyAddBtn.addEventListener('click', () => {
      openForm(false);
      entryDateInput.focus();
    });

    // Medication Radio Toggle
    medicationYesRadio.addEventListener('change', () => {
      medicationAmountField.style.display = 'block';
    });
    medicationNoRadio.addEventListener('change', () => {
      medicationAmountField.style.display = 'none';
    });

    // Quick Chips for Medication Amount (only fills when clicked, doesn't force)
    document.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = btn.getAttribute('data-amount');
        medicationAmountInput.value = amt;
        medicationYesRadio.checked = true;
        medicationAmountField.style.display = 'block';
      });
    });

    // Form Submit
    healthForm.addEventListener('submit', handleFormSubmit);

    // Search Input
    searchInput.addEventListener('input', render);
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      render();
    });

    // Delegated actions on entry cards (Copy, Edit, Delete)
    entriesList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'copy') {
        copySummaryToClipboard(id);
      } else if (action === 'edit') {
        const entry = healthEntries.find(item => item.id === id);
        if (entry) {
          populateFormForEdit(entry);
        }
      } else if (action === 'delete') {
        promptDeleteEntry(id);
      }
    });

    // Modal Confirmation
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', e => {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });

    // Keyboard support: Escape closes modal or form
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!deleteModal.hidden) {
          closeDeleteModal();
        } else if (entryFormSection.style.display !== 'none') {
          closeForm();
        }
      }
    });

    // Sample Data Loader
    loadSampleBtn.addEventListener('click', loadSampleData);
  }

  // --- SAMPLE DATA GENERATOR (Optional helper for testing) ---
  function loadSampleData() {
    const today = getTodayDateString();
    
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yesterdayStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`;

    healthEntries = [
      {
        id: 'entry_sample_today',
        date: today,
        bloodSugar: 94,
        bpRightSystolic: 122,
        bpRightDiastolic: 78,
        bpRightPulse: 72,
        bpLeftSystolic: 120,
        bpLeftDiastolic: 76,
        bpLeftPulse: 70,
        medicationTaken: 'yes',
        medicationAmount: 'Metformin 500mg',
        mealMorning: 'Warm oatmeal with blueberries and green tea',
        mealAfternoon: 'Chicken vegetable broth with soft whole wheat toast',
        mealEvening: 'Steamed salmon, soft bok choy, and half cup of rice',
        createdAt: Date.now()
      },
      {
        id: 'entry_sample_yesterday',
        date: yesterdayStr,
        bloodSugar: 132,
        bpRightSystolic: 142,
        bpRightDiastolic: 88,
        bpRightPulse: 78,
        bpLeftSystolic: 126,
        bpLeftDiastolic: 82,
        bpLeftPulse: 75,
        medicationTaken: 'yes',
        medicationAmount: '1g',
        mealMorning: 'One boiled egg, whole wheat bread with light butter',
        mealAfternoon: 'Lentil soup and steamed broccoli',
        mealEvening: 'Grilled tofu with cooked carrots and sweet potato',
        createdAt: Date.now() - 86400000
      }
    ];

    saveEntriesToStorage();
    render();
    showToast('Loaded 2 sample entries to explore!', '✨');
  }

  // Launch app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
