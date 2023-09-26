"use strict";

class TaskBox extends HTMLElement {
  #validStatuses;
  #newTaskCallbacks;
  #shadow;
  constructor() {
    super();

    this.#validStatuses = [];
    this.#newTaskCallbacks = [];
    this.#shadow = this.attachShadow({ mode: "closed" });

    this.#makeHTML();
    this.#makeFunctionality();
  }

  #makeHTML() {
    const wrapper = document.createElement("div");

    const content = `
    <link rel="stylesheet" type="text/css" href="${
      import.meta.url.match(/.*\//)[0]
    }styles/taskview.css" />

    <dialog>
      <!-- Modal content -->
      <span>&times;</span>
      <div>
        <div>Title:</div>
        <div>
          <input
            id="taskbox-input"
            type="text"
            size="25"
            maxlength="80"
            placeholder="Task title" autofocus
          />
        </div>
        <div>Status:</div>
        <div>
          <select id="taskbox-select">

          </select>
        </div>
      </div>
      <button>Add task</button>
    </dialog>
  `;

    wrapper.insertAdjacentHTML("beforeend", content);
    this.#shadow.appendChild(wrapper);

    return wrapper;
  }

  #makeFunctionality() {
    // Get the close button (span element) and add a click event listener to it
    const closeButton = this.#shadow.querySelector("span");
    closeButton.addEventListener("click", () => {
      this.close();
    });

    // Add task functionality - need to get the input elements
    const addButton = this.#shadow.querySelector("button");
    const inputElement = this.#shadow.querySelector("#taskbox-input");
    const selectElement = this.#shadow.querySelector("#taskbox-select");

    // Add an event handler
    addButton.addEventListener("click", () => {
      for (const callback of this.#newTaskCallbacks) {
        // Create the new task
        const task = {
          title: inputElement.value,
          status: selectElement.value,
        };

        // Invoke each callback with this new task, but spread object
        // to create a unique object per invocation. This stops any bugs
        // where someone accidentally modifies the task :)
        callback({ ...task });
      }
    });
  }

  setStatuseslist(list) {
    // sets the list of possible task statuses

    // Assert that none of us tries to call this function with an invalid argument
    if (!Array.isArray(list))
      throw new Error("Statuses list must be an array...");

    this.#validStatuses = list;

    // Get the <select> element
    const selectElement = this.#shadow.querySelector("#taskbox-select");

    // Remove any existing <option> elements
    while (selectElement.firstChild) {
      selectElement.removeChild(selectElement.firstChild);
    }

    // Create and append new <option> elements
    list.forEach((status) => {
      const optionElement = document.createElement("option");
      optionElement.value = status;
      optionElement.textContent = status;
      selectElement.appendChild(optionElement);
    });
  }

  newtaskCallback(callback) {
    // adds a callback to run at click on the Add task button

    // Assert that none of us tries to call this function with an invalid argument
    if (typeof callback !== "function")
      throw new Error("Callback must be a function...");

    this.#newTaskCallbacks.push(callback);
  }

  show() {
    // Get the <dialog> element
    const dialog = this.#shadow.querySelector("dialog");

    // Show the modal box in the browser window
    dialog.showModal();
  }

  close() {
    // Get the <dialog> element
    const dialog = this.#shadow.querySelector("dialog");

    // Hide the modal box
    dialog.close();
  }
}

customElements.define("task-box", TaskBox);
