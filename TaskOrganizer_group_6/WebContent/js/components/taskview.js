const template = document.createElement("template");

template.innerHTML = `
      <link rel="stylesheet" type="text/css" href="${
        import.meta.url.match(/.*\//)[0]
      }styles/taskview.css" />

      <h1>Tasks</h1>

      <div id="message"><p>Waiting for server data.</p></div>
      <div id="newtask">
        <button type="button" disabled>New task</button>
      </div>

      <!-- The task list -->
      <task-list>
        <tr slot="task"></tr>
      </task-list>

      <!-- The Modal -->
      <task-box></task-box>
    `;

class TaskView extends HTMLElement {
  #shadow;
  #data_serviceurl;
  #tasks;
  #statuses;
  constructor() {
    super();

    this.#shadow = this.attachShadow({ mode: "closed" });
    this.#data_serviceurl = this.getAttribute("data-serviceurl");

    this.#initialize();
  }

  async #initialize() {
    try {
      this.#tasks = await this.#getTasks();
      this.#statuses = await this.#getStatuses();

      this.#makeHTML();
      this.#makeTasklist();
      this.#buttonFunctionality();
      this.#tasklistFunctionality();

      console.log(this.#data_serviceurl);
    } catch (error) {
      console.error("Error initializing TaskView:", error);
    }
  }

  #makeHTML() {
    const content = template.content.cloneNode(true);
    // Append the template content to the custom element
    this.#shadow.appendChild(content);
    return template;
  }

  async #getTasks() {
    try {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      };

      const response = await fetch(
        `${this.#data_serviceurl}/tasklist`,
        options
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.tasks)) {
        console.error("Unexpected response structure", data);
        return [];
      }

      console.log(data.tasks);
      return data.tasks;
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  }

  async #getStatuses() {
    try {
      const options = {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      };

      const response = await fetch(
        `${this.#data_serviceurl}/allstatuses`,
        options
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.allstatuses)) {
        console.error("Unexpected response structure", data);
        return [];
      }

      return data.allstatuses;
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  }

  #makeTasklist() {
    const tasklist = this.#shadow.querySelector("task-list");

    tasklist.setStatuseslist(this.#statuses);

    const messageElement = this.#shadow.querySelector("#message");
    const newTaskButton = this.#shadow.querySelector("#newtask button");

    messageElement.innerHTML = "<p>Waiting for server data.</p>";
    newTaskButton.disabled = true;

    if (this.#tasks.length === 0) {
      messageElement.innerHTML = "<p>Found no tasks.</p>";
    } else {
      messageElement.innerHTML = `<p>Found ${this.#tasks.length} task${
        this.#tasks.length !== 1 ? "s" : ""
      }.</p>`;
    }

    newTaskButton.disabled = false;

    for (let t of this.#tasks) {
      tasklist.showTask(t);
    }
  }

  #updateMessage() {
    const tasklist = this.#shadow.querySelector("task-list");
    const messageElement = this.#shadow.querySelector("#message");
    const newTaskButton = this.#shadow.querySelector("#newtask button");

    messageElement.innerHTML = "<p>Waiting for server data.</p>";
    newTaskButton.disabled = true;

    if (tasklist.getNumTasks() === 0) {
      messageElement.innerHTML = "<p>Found no tasks.</p>";
    } else {
      messageElement.innerHTML = `<p>Found ${tasklist.getNumTasks()} task${
        tasklist.getNumTasks() !== 1 ? "s" : ""
      }.</p>`;
    }

    newTaskButton.disabled = false;
  }

  #buttonFunctionality() {
    const tasklist = this.#shadow.querySelector("task-list");
    const button = this.#shadow.querySelector("button");
    button.addEventListener("click", () => {
      const taskbox = this.#shadow.querySelector("task-box");
      taskbox.show();
      taskbox.setStatuseslist(this.#statuses);
      taskbox.newtaskCallback(async (task) => {
        try {
          const addedTask = await this.#addTaskToDatabase(
            task.title,
            task.status
          ); // You can change title and status as needed
          tasklist.clearTasks();
          this.#makeTasklist();
          tasklist.showTask(addedTask);
          taskbox.close();
          this.#updateMessage();
          console.log("Task added successfully:", addedTask);
        } catch (error) {
          console.error("Failed to add task:", error);
          // Handle the error appropriately, e.g., show an error message
        }
      });
    });
  }

  #tasklistFunctionality() {
    const tasklist = this.#shadow.querySelector("task-list");
    tasklist.deletetaskCallback(async (task) => {
      await this.#deleteTask(task.id);
      tasklist.removeTask(task.id);
      this.#updateMessage();
    });
    tasklist.changestatusCallback(async (task) => {
      try {
        const updatedStatus = await this.#updateTaskStatus(
          task.id,
          task.status
        );
        tasklist.updateTask(task);
        console.log("Task status updated successfully:", updatedStatus);
      } catch (error) {
        console.error("Failed to update task status:", error);
        // Handle the error appropriately, e.g., show an error message
      }
    });
  }

  #addTaskToDatabase(title, status) {
    return new Promise(async (resolve, reject) => {
      try {
        const postData = {
          title: title,
          status: status,
        };

        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify(postData),
        };

        const response = await fetch(`${this.#data_serviceurl}/task`, options);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = await response.json();

        if (responseData.responseStatus) {
          // Task was added successfully
          resolve(responseData.task); // Resolve with the added task
        } else {
          // Task was not added successfully
          reject(new Error("Task could not be added to the database."));
        }
      } catch (error) {
        console.error("Error adding task to the database:", error);
        reject(error);
      }
    });
  }

  async #updateTaskStatus(taskId, newStatus) {
    try {
      const putData = {
        status: newStatus,
      };

      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(putData),
      };

      const response = await fetch(
        `${this.#data_serviceurl}/task/${taskId}`,
        options
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.responseStatus) {
        // Task status was updated successfully
        return responseData.status; // Return the updated status
      } else {
        // Task status was not updated successfully
        throw new Error("Task status could not be updated in the database.");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  }

  async #deleteTask(id) {
    try {
      // Construct the DELETE request URL based on the data-serviceurl attribute
      const deleteUrl = `${this.#data_serviceurl}/task/${id}`;

      // Send the DELETE request to the server
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.responseStatus) {
        // Task was deleted successfully on the server
        console.log(`Task with ID ${id} deleted successfully.`);
        // You may also want to update the UI to reflect the deletion here.
      } else {
        // Task deletion on the server was not successful
        console.error("Task deletion failed.");
        // Handle the error appropriately.
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      // Handle any errors that occur during the deletion process.
    }
  }
}

customElements.define("task-view", TaskView);
