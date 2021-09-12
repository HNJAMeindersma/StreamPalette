// Startup tasks
document.title = document.head.querySelector("[name~=application-name][content]").content;
document.getElementById('player-title').innerHTML = document.head.querySelector("[name~=application-name][content]").content;
document.getElementById('palette').setAttribute('style', '--button-size: 1.5rem; --button-width-min: 8rem; --button-width-max: 24rem;');
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
    if(data.settings.showDarkButtons === true) {
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
    if(data.settings.showDarkButtons === true) {
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
  var showDarkButtons, showTextOnly, showIconsOnly;
  try {
    if(dataCache.settings.showDarkButtons) {
      showDarkButtons = ' checked';
    }
  } catch(e) {
    showDarkButtons = ' disabled';
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

  // Build modal
  document.getElementById('staticBackdropLabel').innerHTML = 'Settings panel';
  document.getElementById('staticBackdropBody').innerHTML = `
  <h6>Overrule appearance</h6>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" id="showDarkButtons"${showDarkButtons}>
    <label class="form-check-label" for="showDarkButtons">Show dark buttons</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" value="" id="showTextOnly"${showTextOnly}>
    <label class="form-check-label" for="showTextOnly">Show text only</label>
  </div>
  <div class="form-check form-switch">
    <input class="form-check-input" type="checkbox" value="" id="showIconsOnly"${showIconsOnly}>
    <label class="form-check-label" for="showIconsOnly">Show icons only</label>
  </div>
  `;
  document.getElementById('staticBackdropFooter').classList.add('d-none');

  // Listen for changes
  document.getElementById('showDarkButtons').addEventListener('input', function() {
    dataCache.settings.showDarkButtons = document.getElementById('showDarkButtons').checked;
    renderPalette(dataCache);
  });
  document.getElementById('showTextOnly').addEventListener('input', function() {
    dataCache.settings.showTextOnly = document.getElementById('showTextOnly').checked;
    renderPalette(dataCache);
  });
  document.getElementById('showIconsOnly').addEventListener('input', function() {
    dataCache.settings.showIconsOnly = document.getElementById('showIconsOnly').checked;
    renderPalette(dataCache);
  });

  // Show modal
  bootstrap.Modal.getOrCreateInstance(document.getElementById('staticBackdrop')).show();

};
