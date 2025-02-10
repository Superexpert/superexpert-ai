function ServerTask(): ClassDecorator {
    return function (target: Function) {
      serverTasks.push(target);
    };
  }
  