/**
 * Fancy debut tool 
 * @author Archie /**
  * 
  */

(function() {
    const loadedFiles = [];

    // Patch script elements to detect load
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      script.addEventListener('load', () => {
        loadedFiles.push(script.src.split('/').pop());
        showDebug();
      });
    });

    function showDebug() {
      console.clear(); // optional: clear console for cleaner view
      const filesList = loadedFiles.join(' | ');
      console.log(
        `%cLoaded files%c: ${filesList} %c- healthy present in the debug section nearly`,
        'background: black; color: yellow; font-weight: bold;', // label
        'color: lightgreen; font-weight: bold;',                  // files
        'color: cyan; font-style: italic;'                        // message
      );
    }
})();