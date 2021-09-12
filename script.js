// Startup tasks
document.title = document.head.querySelector("[name~=application-name][content]").content;
document.getElementById('player-title').innerHTML = document.head.querySelector("[name~=application-name][content]").content;
//document.getElementById('palette').setAttribute('style', '--button-size: 1.5rem; --button-width-min: 0rem; --button-width-max: 24rem;');
document.getElementById('player-settings').disabled = false;

var dataCache;

// FUNCTIONS START -------------------------------------------------------------

// Sort array by key attribute
function sortKeyAttribute(prop) {
  return function(a, b) {
    if(a[prop] > b[prop]) {
      return 1;
    } else if (a[prop] < b[prop]) {
      return -1;
    }
    return 0;
  };
}

// Create palette
function renderPalette(data) {

  // Update data cache
  dataCache = data;

  // Deploy general settings
  document.getElementById('palette').setAttribute('style', '--button-size: ' + data.settings.buttonSize + 'rem; --button-width-min: ' + data.settings.buttonWidthMin + 'rem; --button-width-max: ' + data.settings.buttonWidthMax + 'rem;');

  // Find palette element and clear it
  var palette = document.getElementById('palette');
  palette.innerHTML = '';

  // Get playlist and sort it
  var playlist = data.playlist.sort(sortKeyAttribute('order'));

  // Create HTML objects
  playlist.forEach(function(item) {

    // Create element
    var element = document.createElement('button');
    element.setAttribute('type', 'button');
    element.setAttribute('class', 'm-3 btn btn-xl button-rules');

    // Set data attributes
    element.setAttribute('data-type', item.type);
    element.setAttribute('data-order', item.order);
    element.setAttribute('data-name', item.name);
    element.setAttribute('data-name-search', item.name.toLowerCase());
    element.setAttribute('title', item.name);

    // Set button face
    if(data.settings.showMonoButtons === true) {
      element.innerHTML = item.name;
    } else if(data.settings.showTextOnly === true) {
      element.innerHTML = item.name;
    } else {
      try {
        url = new URL(item.icon);
        if(!item.showIconOnly && item.name && data.settings.showIconsOnly !== true) {
          element.innerHTML = '<img class="me-3" src="' + item.icon + '" />' + item.name;
        } else {
          element.innerHTML = '<img src="' + item.icon + '" />';
        }
      } catch(error) {
        element.innerHTML = item.name;
      }
    }

    // Set button background
    if(data.settings.showMonoButtons === true) {
      element.setAttribute('style', '--bg-color: #000;');
    } else if(data.settings.showTextOnly === true) {
      element.setAttribute('style', '--bg-color: ' + item.color + ';');
    } else {
      try {
        url = new URL(item.background);
        element.setAttribute('style', '--bg-color: ' + item.color + '; --bg-image: url(' + item.background + ');');
      } catch(error) {
        element.setAttribute('style', '--bg-color: ' + item.color + ';');
      }
    }

    // Check display
    if(item.showChannel === false) {
      return;
    }

    // Check playlist item type
    if(item.type == 'stream') {

      // Set data attributes
      element.setAttribute('data-url', item.url);

    } else if(item.type == 'group') {

      // Set data attributes
      element.setAttribute('data-group', JSON.stringify(item.streams));
      var groupSearchKeys = [];
      for(var key in item.streams) {
        groupSearchKeys.push(key.toLowerCase());
      }
      element.setAttribute('data-group-search', JSON.stringify(groupSearchKeys));

    } else {

      // Skip other playlist item types
      return;

    }

    // Push element to palette
    palette.appendChild(element);
    document.getElementById('palette-search').disabled = false;
    lastElement = palette.lastElementChild;

    // Set event listener depending on item type
    if(item.type == 'stream') {
      lastElement.addEventListener('click', function() {

        document.getElementById('player').src = this.getAttribute('data-url');
        document.getElementById('player').play();
        document.title = this.getAttribute('data-name') + ' - ' + document.head.querySelector("[name~=application-name][content]").content;
        document.getElementById('player-title').innerHTML = this.getAttribute('data-name');
        document.getElementById('player-title').classList.add('text-muted');
        document.getElementById('player-pause').disabled = false;
        document.getElementById('player-stop').disabled = false;

      });
    } else if(item.type == 'group') {
      lastElement.addEventListener('click', function() {

        // Build modal
        document.getElementById('staticBackdropLabel').innerHTML = this.getAttribute('data-name');
        document.getElementById('staticBackdropBody').innerHTML = '';
        document.getElementById('staticBackdropFooter').classList.add('d-none');

        var buttonBlock = document.createElement('div');
        buttonBlock.setAttribute('id', 'buttonBlock');
        buttonBlock.setAttribute('class', 'd-grid gap-2 col-8 mx-auto');
        document.getElementById('staticBackdropBody').appendChild(buttonBlock);

        // Build buttons
        for(const [key, value] of Object.entries(JSON.parse(this.getAttribute('data-group')))) {

          var subButton = document.createElement('button');
          subButton.setAttribute('type', 'button');
          subButton.setAttribute('class', 'm-2 btn btn-secondary btn-block');
          subButton.setAttribute('data-name', key);
          subButton.setAttribute('data-url', value);
          subButton.innerHTML = key;
          document.getElementById('buttonBlock').appendChild(subButton);

          var lastSubButton = document.getElementById('buttonBlock').lastElementChild;
          lastSubButton.addEventListener('click', function() {

            document.getElementById('player').src = this.getAttribute('data-url');
            document.getElementById('player').play();
            document.title = this.getAttribute('data-name') + ' - ' + document.head.querySelector("[name~=application-name][content]").content;
            document.getElementById('player-title').innerHTML = this.getAttribute('data-name');
            document.getElementById('player-title').classList.add('text-muted');
            document.getElementById('player-pause').disabled = false;
            document.getElementById('player-stop').disabled = false;
            bootstrap.Modal.getOrCreateInstance(document.getElementById('staticBackdrop')).hide();

          });
        }

        // Show modal
        bootstrap.Modal.getOrCreateInstance(document.getElementById('staticBackdrop')).show();

      });
    }

  });

}

// Drag & drop JSON on element
function dropJSON(target) {

  // Disable default drag listeners
  target.addEventListener('dragenter', function(event){ event.preventDefault(); });
  target.addEventListener('dragover', function(event){ event.preventDefault(); });

  // Listen for drop
  target.addEventListener('drop', function(event) {

    // Read and try to parse JSON file
    var reader = new FileReader();
    reader.onloadend = function() {
      try {
        var data = JSON.parse(this.result);
        renderPalette(data);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('staticBackdrop')).hide();
      } catch(error) {
        alert('Failed to read JSON file: ' + error.name);
      }
    };
    reader.readAsText(event.dataTransfer.files[0]);

    // Disable default drop listener
    event.preventDefault();

  });
}

// FUNCTIONS END ---------------------------------------------------------------

// Set drop callback to body
dropJSON(document.body);

// Pause listeners
document.getElementById('player').onplaying = function() {
  document.getElementById('player-pause').innerHTML = '<span class="oi oi-media-pause"></span>';
  document.getElementById('player-pause').title = 'Pause';
  document.getElementById('player-title').classList.remove('text-muted');
};
document.getElementById('player').onpause = function() {
  document.getElementById('player-pause').innerHTML = '<span class="oi oi-media-play"></span>';
  document.getElementById('player-pause').title = 'Play';
  document.getElementById('player-title').classList.add('text-muted');
};

// Pause button
document.getElementById('player-pause').onclick = function() {
  if(document.getElementById('player').paused) {
    document.getElementById('player').play();
  } else {
    document.getElementById('player').pause();
  }
};

// Stop button
document.getElementById('player-stop').onclick = function() {
  document.getElementById('player').setAttribute('src', '');
  document.getElementById('player').pause();
  setTimeout(function () {
    document.getElementById('player').load();
  });
  document.title = document.head.querySelector("[name~=application-name][content]").content;
  document.getElementById('player-title').innerHTML = document.head.querySelector("[name~=application-name][content]").content;
  document.getElementById('player-title').classList.add('text-muted');
  document.getElementById('player-pause').innerHTML = '<span class="oi oi-media-play"></span>';
  document.getElementById('player-pause').title = 'Play';
  document.getElementById('player-pause').disabled = true;
  document.getElementById('player-stop').disabled = true;
};

// Live search
document.getElementById('palette-search').addEventListener('input', function() {

  // Get list of search results
  var searchList = [];
  var searchFound = document.querySelectorAll('[data-name-search*="' + this.value.toLowerCase() + '"]');
  for(var i = 0; i < searchFound.length; i++) {
    searchList.push(searchFound.item(i).getAttribute('data-name-search'));
  }
  searchFound = document.querySelectorAll('[data-group-search*="' + this.value.toLowerCase() + '"]');
  for(var i = 0; i < searchFound.length; i++) {
    searchList.push(searchFound.item(i).getAttribute('data-name-search'));
  }

  // Change visibility per button
  var buttons = document.getElementsByClassName('button-rules');
  for(var i = 0; i < buttons.length; i++) {
    if(document.getElementById('palette-search').value.length > 0) {
      if(searchList.includes(buttons.item(i).getAttribute('data-name-search'))) {
        buttons.item(i).classList.remove('d-none');
      } else {
        buttons.item(i).classList.add('d-none');
      }
    } else {
      buttons.item(i).classList.remove('d-none');
    }
  }

});

// Capture CTRL+F for build in live search
window.addEventListener('keydown', function(e) {
  if(e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
    e.preventDefault();
    document.getElementById('palette-search').focus();
  }
});

// Build settings panel
document.getElementById('player-settings').onclick = function() {

  // Check setting states
  var showMonoButtons, showTextOnly, showIconsOnly, buttonSize, buttonWidthMin, buttonWidthMax;
  try {
    if(dataCache.settings.showMonoButtons) {
      showMonoButtons = ' checked';
    }
  } catch(e) {
    showMonoButtons = ' disabled';
  }
  try {
    if(dataCache.settings.showTextOnly) {
      showTextOnly = ' checked';
    }
  } catch(e) {
    showTextOnly = ' disabled';
  }
  try {
    if(dataCache.settings.showIconsOnly) {
      showIconsOnly = ' checked';
    }
  } catch(e) {
    showIconsOnly = ' disabled';
  }
  try {
    if(dataCache.settings.buttonSize) {
      buttonSize = dataCache.settings.buttonSize;
    }
  } catch(e) {
    buttonSize = 1.5;
  }
  try {
    if(dataCache.settings.buttonWidthMin) {
      buttonWidthMin = dataCache.settings.buttonWidthMin;
    }
  } catch(e) {
    buttonWidthMin = 0;
  }
  try {
    if(dataCache.settings.buttonWidthMax) {
      buttonWidthMax = dataCache.settings.buttonWidthMax;
    }
  } catch(e) {
    buttonWidthMax = 24;
  }

  // Build modal
  document.getElementById('staticBackdropLabel').innerHTML = 'Settings';
  document.getElementById('staticBackdropBody').innerHTML = `
  <div class="row">
    <div class="col-sm-5">
      <label for="formButtonSize" class="form-label h6">Button size</label>
      <div class="mb-3 input-group">
        <input type="number" class="form-control" id="formButtonSize" placeholder="Button size in 'rem'" value="${buttonSize}">
        <label for="formButtonSize" class="input-group-text">rem</label>
      </div>
    </div>
    <div class="col-sm-7">
      <label for="formButtonWidthMin" class="form-label h6">Button width</label>
      <div class="mb-3 input-group">
        <label for="formButtonWidthMin" class="input-group-text">Minimum</label>
        <input type="number" class="form-control" id="formButtonWidthMin" placeholder="Minimum button width in 'rem'" value="${buttonWidthMin}">
        <label for="formButtonWidthMin" class="input-group-text">rem</label>
      </div>
      <div class="mb-3 input-group">
        <label for="formButtonWidthMax" class="input-group-text">Maximum</label>
        <input type="number" class="form-control" id="formButtonWidthMax" placeholder="Maximum button width in 'rem'" value="${buttonWidthMax}">
        <label for="formButtonWidthMax" class="input-group-text">rem</label>
      </div>
    </div>
  </div>
  <h6>Global appearance</h6>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="formShowMonoButtons"${showMonoButtons}>
    <label class="form-check-label" for="formShowMonoButtons">Show monotone buttons</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" value="" id="formShowTextOnly"${showTextOnly}>
    <label class="form-check-label" for="formShowTextOnly">Only show text on buttons</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" value="" id="formShowIconsOnly"${showIconsOnly}>
    <label class="form-check-label" for="formShowIconsOnly">Only show icons on buttons</label>
  </div>
  <hr class="my-3 bg-dark bg-opacity-25">
  <h6>Predefined playlists</h6>
  <div class="mb-3 input-group">
    <select class="form-select" id="inputGroupSelect04" aria-label="Example select with button addon" disabled>
      <option selected>Choose...</option>
      <option value="1">One</option>
      <option value="2">Two</option>
      <option value="3">Three</option>
    </select>
    <button class="btn btn-outline-secondary" type="button" disabled>Load</button>
  </div>
  <hr class="my-3 bg-dark bg-opacity-25">
  <h6>Load your own playlist</h6>
  <div class="mb-3 input-group">
    <input type="file" class="form-control" id="inputGroupFile04" aria-describedby="inputGroupFileAddon04" aria-label="Local" disabled>
    <button class="btn btn-outline-secondary" type="button" id="inputGroupFileAddon04" disabled>Load</button>
  </div>
  <div class="mb-3 input-group">
    <label class="input-group-text" for="inputGroupSelect02">Cached</label>
    <select class="form-select" id="inputGroupSelect02" aria-label="Example select with button addon" disabled>
      <option selected>Choose...</option>
      <option value="1">One</option>
      <option value="2">Two</option>
      <option value="3">Three</option>
    </select>
    <button class="btn btn-outline-danger" type="button" disabled>Delete</button>
    <button class="btn btn-outline-secondary" type="button" disabled>Load</button>
  </div>
  <hr class="my-3 bg-dark bg-opacity-25">
  <h6>Change audio output</h6>
  <div class="mb-3 input-group">
    <select class="form-select" id="inputGroupSelect06" aria-label="Example select with button addon" disabled>
      <option selected>Choose...</option>
      <option value="1">One</option>
      <option value="2">Two</option>
      <option value="3">Three</option>
    </select>
  </div>
  `;
  document.getElementById('staticBackdropFooter').classList.add('d-none');

  // Listen for changes
  document.getElementById('formButtonSize').addEventListener('input', function() {
    dataCache.settings.buttonSize = document.getElementById('formButtonSize').value;
    renderPalette(dataCache);
  });
  document.getElementById('formButtonWidthMin').addEventListener('input', function() {
    dataCache.settings.buttonWidthMin = document.getElementById('formButtonWidthMin').value;
    renderPalette(dataCache);
  });
  document.getElementById('formButtonWidthMax').addEventListener('input', function() {
    dataCache.settings.buttonWidthMax = document.getElementById('formButtonWidthMax').value;
    renderPalette(dataCache);
  });
  document.getElementById('formShowMonoButtons').addEventListener('input', function() {
    dataCache.settings.showMonoButtons = document.getElementById('formShowMonoButtons').checked;
    renderPalette(dataCache);
  });
  document.getElementById('formShowTextOnly').addEventListener('input', function() {
    dataCache.settings.showTextOnly = document.getElementById('formShowTextOnly').checked;
    renderPalette(dataCache);
  });
  document.getElementById('formShowIconsOnly').addEventListener('input', function() {
    dataCache.settings.showIconsOnly = document.getElementById('formShowIconsOnly').checked;
    renderPalette(dataCache);
  });

  // Show modal
  bootstrap.Modal.getOrCreateInstance(document.getElementById('staticBackdrop')).show();

};
