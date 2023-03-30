const storageKey = "reminders";
let timer;
let showCompleted = false;
let showDeleted = false;

function getReminders() {
  const storedData = localStorage.getItem(storageKey);
  return storedData ? JSON.parse(storedData) : [];
}

function saveReminders(reminders) {
  localStorage.setItem(storageKey, JSON.stringify(reminders));
}

function updateList() {
  const reminders = getReminders()
    .map((r) => ({ ...r, datetime: new Date(r.datetime) }))
    .sort((a, b) => a.datetime - b.datetime);
  const list = document.getElementById("list");
  list.innerHTML = "";

  for (const reminder of reminders) {
    if (!showCompleted && reminder.completed) {
      continue;
    }
    if (!showDeleted && reminder.deleted) {
      continue;
    }
    const entry = document.createElement("div");
    entry.className = "entry mb-3";

    if (reminder.deleted) {
      entry.style.backgroundColor = "black";
    } else if (reminder.completed) {
      entry.style.backgroundColor = "lightgray";
    } else if (reminder.pushed) {
      entry.style.backgroundColor = "lightsalmon";
    }
    parsedDate = new Date(reminder.datetime);
    entry.innerHTML = `
                  <div class="d-flex justify-content-between">
                      <div class="ml-2">
                          <strong>${reminder.title}</strong><br>
                          ${parsedDate.getFullYear()}-${String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(
      2,
      "0"
    )} ${String(parsedDate.getHours()).padStart(2, "0")}:${String(
      parsedDate.getMinutes()
    ).padStart(2, "0")}
                      </div>
                      <div class="btn-group">
                          <button data-id="${
                            reminder.id
                          }" class="complete btn btn-info btn-sm mr-2 mt-2 mb-2" style="height:2.5em;">Complete</button>
                          <button data-id="${
                            reminder.id
                          }" class="delete btn btn-secondary btn-sm mr-2 mt-2 mb-2" style="height:2.5em;">Delete</button>
                      </div>
                  </div>
              `;

    list.appendChild(entry);
  }
}

function addReminder(title, datetime) {
  const reminders = getReminders();
  const newReminder = {
    id: Date.now(),
    title,
    datetime,
    completed: false,
    pushed: false,
    deleted: false,
  };

  reminders.push(newReminder);
  saveReminders(reminders);
  updateList();
  setTimer();
}

function deleteReminder(id) {
  const reminders = getReminders().map(function (r) {
    if (r.id == id) {
      r.deleted = true;
    }
    return r;
  });
  saveReminders(reminders);
  updateList();
  setTimer();
}

function completeReminder(id) {
  const reminders = getReminders();
  const reminderIndex = reminders.findIndex((r) => r.id === id);
  if (reminderIndex !== -1) {
    reminders[reminderIndex].completed = !reminders[reminderIndex].completed;
    saveReminders(reminders);
    updateList();
    setTimer();
  }
}

function toggleCompletedTasks() {
  showCompleted = !showCompleted;
  const toggleButton = document.getElementById("toggle-completed");
  if (showCompleted) {
    toggleButton.textContent = "Hide completed tasks";
  } else {
    toggleButton.textContent = "Show completed tasks";
  }
  updateList();
}

function toggleDeletedTasks() {
  showDeleted = !showDeleted;
  const toggleButton = document.getElementById("toggle-deleted");
  if (showDeleted) {
    toggleButton.innerHTML = "Hide deleted tasks";
  } else {
    toggleButton.innerHTML = "Show deleted tasks";
  }
  updateList();
}
function setTimer() {
  clearTimeout(timer);
  var reminders = getReminders();
  const now = new Date();
  var sortedReminders = reminders
    .map((r) => ({ ...r, datetime: new Date(r.datetime) }))
    .filter((r) => !r.pushed && !r.deleted && !r.completed)
    .sort((a, b) => a.datetime - b.datetime);
  var nextReminder = sortedReminders.shift();

  var pushedReminders = reminders.filter(
    (r) => r.pushed || r.deleted || r.completed
  );

  if (nextReminder) {
    timer = setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification(nextReminder.title);
        nextReminder.pushed = true;
        sortedReminders.unshift(nextReminder);
        saveReminders(sortedReminders.concat(pushedReminders));
        updateList();
        setTimer();
      }
    }, nextReminder.datetime - now);
  }
}

function parseDateInTitleOnlyMatchString(title) {
  const dateRegEx =
    / (?:(\d{4})[/-])?(\d{1,2})[/-]?(\d{1,2})?(?:[ T]?(\d{1,2})?:?(\d{1,2})?)?/;
  const matches = title.match(dateRegEx);

  if (matches) {
    let [_, year, month, day, hour = "00", minute = "00"] = matches;
    if (_) {
      return _;
    }
  }
  return null;
}
function parseDateInTitle(title) {
  const dateRegEx =
    / (?:(\d{4})[/-])?(\d{1,2})[/-]?(\d{1,2})?(?:[ T]?(\d{1,2})?:?(\d{1,2})?)?/;
  const matches = title.match(dateRegEx);

  if (matches) {
    let [_, year, month, day, hour = "00", minute = "00"] = matches;

    const today = new Date();

    if (!year && month && hour === "00" && minute) {
      hour = month;
      month = undefined;
    }

    if (!year && !day) {
      // time format (e.g., 01:20)
      year = today.getFullYear();
      month = today.getMonth() + 1;
      day = today.getDate();
    } else if (!year) {
      // month-day format (e.g., 04/01)
      year = parseInt(today.getFullYear(), 10);
      if (today.getMonth() + 1 > parseInt(month, 10)) {
        year++;
      }
    }

    const date = new Date(year, month - 1, day || 1, hour, minute, 0);

    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
}

function updateDatetimeInput(title) {
  const datetimeInput = document.getElementById("datetime");
  const parsedDate = parseDateInTitle(title);
  if (parsedDate) {
    datetimeInput.value = `${parsedDate.getFullYear()}-${String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(
      2,
      "0"
    )} ${String(parsedDate.getHours()).padStart(2, "0")}:${String(
      parsedDate.getMinutes()
    ).padStart(2, "0")}:${String(parsedDate.getSeconds()).padStart(2, "0")}`;
  }
}

function init() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications.");
  } else if (Notification.permission !== "granted") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        setTimer();
      }
    });
  }

  updateList();

  const titleInput = document.getElementById("title");
  titleInput.addEventListener("input", () => {
    updateDatetimeInput(titleInput.value);
  });

  titleInput.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      document.getElementById("add").click();
    }
  });

  const datetimeInput = document.getElementById("datetime");
  datetimeInput.addEventListener("keydown", (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      document.getElementById("add").click();
    }
  });

  const addButton = document.getElementById("add");
  addButton.addEventListener("click", () => {
    const datetimeInput = document.getElementById("datetime");

    let title = titleInput.value;
    const datetime = datetimeInput.value;

    if (title && datetime) {
      const parsedDate = parseDateInTitleOnlyMatchString(title);
      if (parsedDate) {
        title = title.replace(parsedDate, "").trim();
      }
      var reminders = getReminders();
      var registedReminders = reminders
        .map((r) => ({ ...r, datetime: new Date(r.datetime) }))
        .filter((r) => r.datetime - new Date(datetime) == 0);

      if (registedReminders[0]) {
        alert(
          "That date/time is already registered. Please choose a time at least 1 minute later."
        );
      } else {
        addReminder(title, datetime);
        titleInput.value = "";
        datetimeInput.value = "";
      }
    } else {
      alert("Please enter the task and date/time.");
    }
  });

  const list = document.getElementById("list");
  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete")) {
      const id = parseInt(e.target.dataset.id);
      deleteReminder(id);
    }
  });

  setTimer();
}

const list = document.getElementById("list");
list.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    const id = parseInt(e.target.dataset.id);
    deleteReminder(id);
  } else if (e.target.classList.contains("complete")) {
    const id = parseInt(e.target.dataset.id);
    completeReminder(id);
  }
});

const toggleCompletedButton = document.getElementById("toggle-completed");
toggleCompletedButton.addEventListener("click", () => {
  toggleCompletedTasks();
});

const toggleDeletedButton = document.getElementById("toggle-deleted");
toggleDeletedButton.addEventListener("click", () => {
  toggleDeletedTasks();
});

init();
