class Tasklist extends HTMLElement {
  #statuseslist;
  #shadow;
  #taskList;
  #changestatusCallbacks;
  #deletetaskCallback;
  constructor() {
    super();

    this.#statuseslist = [];
    this.#taskList = [];
    this.#changestatusCallbacks = [];
    this.#deletetaskCallback = [];
    this.#shadow = this.attachShadow({ mode: "closed" });

    this.#makeHTML();
    this.#addFunctionality();
  }

  #makeHTML() {
    const wrapper = document.createElement("div");

    const content = `
      <table>
        <tbody>
          <tr>
            <th>Task</th>
            <th>Status</th>
          </tr>
          ${this.#mapTaskListToDisplay()}
        </tbody>  
      </table>
      `;

    wrapper.insertAdjacentHTML("beforeend", content);
    this.#shadow.appendChild(wrapper);

    return wrapper;
  }

  #mapTaskListToDisplay() {
    return this.#taskList
      .map((task) => {
        return `
        <tr>
          <td>${task.title}</td>
          <td>${task.status}</td>
          <td>
            <select data-task-id="${task.id}">
              <option value="">Modify</option>
              ${this.#mapStatusListToDisplay()}
            </select>
          </td>
          <td>
            <button type="button" data-task-id="${task.id}" data-task-title="${
          task.title
        }">Remove</button>
          </td>
        </tr>
      `;
      })
      .join(""); // Use join to convert the array to a string
  }

  #mapStatusListToDisplay() {
    return this.#statuseslist
      .map((status) => {
        return `<option>${status}</option>`;
      })
      .join(""); // Use join to convert the array to a string
  }

  #updateContent() {
    // Clear the existing content
    this.#shadow.innerHTML = "";

    // Recreate and insert the updated content
    const wrapper = document.createElement("div");

    const content = `
      <table>
        <tbody>
          <tr>
            <th>Task</th>
            <th>Status</th>
          </tr>
          ${this.#mapTaskListToDisplay()}
        </tbody>  
      </table>
    `;

    if (this.#taskList.length > 0) {
      wrapper.insertAdjacentHTML("beforeend", content);
    }
    this.#shadow.appendChild(wrapper);

    // Reattach the event listeners to the new elements
    this.#addFunctionality();
  }

  #addFunctionality() {
    const selects = this.#shadow.querySelectorAll("select");
    selects.forEach((select) => {
      select.addEventListener("change", (event) => {
        console.log("check");
        for (const callback of this.#changestatusCallbacks) {
          const status = {
            id: Number(event.target.getAttribute("data-task-id")), // Convert to number
            status: select.value,
          };

          callback({ ...status });
        }
      });
    });

    const buttons = this.#shadow.querySelectorAll("button");
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        console.log("check");
        const confirmationMessage =
          "Are you sure you want to delete task " +
          event.target.getAttribute("data-task-title");
        const userConfirmed = window.confirm(confirmationMessage);
        if (userConfirmed) {
          for (const callback of this.#deletetaskCallback) {
            // Create the new task
            const task = {
              id: Number(event.target.getAttribute("data-task-id")), // Convert to number
            };

            callback({ ...task });
          }
        }
      });
    });
  }

  setStatuseslist(list) {
    this.#statuseslist = list;
  }

  showTask(task) {
    this.#taskList.unshift(task);
    this.#updateContent();
  }

  updateTask(status) {
    for (let task of this.#taskList) {
      if (task.id === status.id) {
        task.status = status.status;
      }
    }
    this.#updateContent();
  }

  removeTask(id) {
    this.#taskList = this.#taskList.filter((task) => task.id !== id);
    this.#updateContent();
  }

  changestatusCallback(callback) {
    if (typeof callback !== "function")
      throw new Error("Callback must be a function...");

    this.#changestatusCallbacks.push(callback);
  }

  deletetaskCallback(callback) {
    if (typeof callback !== "function")
      throw new Error("Callback must be a function...");

    this.#deletetaskCallback.push(callback);
  }

  getNumTasks() {
    return this.#taskList.length;
  }

  clearTasks() {
    this.#taskList = [];
  }
}

customElements.define("task-list", Tasklist);
