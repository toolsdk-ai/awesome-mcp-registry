export const createQueue = (queueName) => {
    const queue = [];
    
    const add = (task) => {
      queue.push(task);
      processTask();
    };
  
    const processTask = async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        try {
          const pdfPath = await generatePDFFromHTML(
            task.htmlPath,
            task.outputDir,
            task.fileName
          );
          task.callback(pdfPath);
        } catch (error) {
          task.error(error);
        }
      }
    };
  
    return { add };
  };
  
  export const queueProcessor = () => {
    // Lógica de procesamiento en segundo plano
  };
  