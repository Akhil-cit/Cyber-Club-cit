(function() {
  'use strict';

  var config = loadConfig();
  var cropper = null;
  var editingMemberIdx = null;
  var editingGroupIdx = null;
  var croppedDataUrl = null;

  function loadConfig() {
    var saved = localStorage.getItem('cyberclub_config');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return JSON.parse(JSON.stringify(CYBER_CLUB_CONFIG));
  }

  function saveConfig() {
    localStorage.setItem('cyberclub_config', JSON.stringify(config, null, 2));
  }

  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getInitials(name) {
    return name.split(' ').map(function(w){ return w[0]; }).join('').substring(0,2).toUpperCase();
  }

  function showStatus(msg, isError) {
    var el = document.getElementById('statusMsg');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.borderColor = isError ? '#ff5a5a' : 'var(--accent)';
    el.style.color = isError ? '#ff5a5a' : 'var(--accent)';
    setTimeout(function() { el.style.display = 'none'; }, 3000);
  }

  // LOGIN
  function doLogin() {
    var user = document.getElementById('loginUser').value.trim();
    var pass = document.getElementById('loginPass').value;
    if (user === config.admin.username && pass === config.admin.password) {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('adminBody').classList.add('active');
      document.getElementById('loginError').style.display = 'none';
      renderMembersList();
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  }

  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('loginUser').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  document.getElementById('logoutBtn').addEventListener('click', function() {
    document.getElementById('adminBody').classList.remove('active');
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('loginPass').value = '';
  });

  // TAB NAV
  var navLinks = document.querySelectorAll('.admin-nav a');
  navLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.forEach(function(l) { l.classList.remove('active'); });
      link.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(function(p) { p.classList.add('hidden'); });
      document.getElementById('panel' + link.dataset.panel.charAt(0).toUpperCase() + link.dataset.panel.slice(1)).classList.remove('hidden');
      if (link.dataset.panel === 'settings') loadSettings();
      if (link.dataset.panel === 'github') loadGhSettings();
    });
  });

  // RENDER MEMBERS LIST
  function renderMembersList() {
    var container = document.getElementById('membersList');
    var html = '';
    if (!config.groups || config.groups.length === 0) {
      html = '<div class="empty-state">No groups yet. Add one to get started.</div>';
      container.innerHTML = html;
      return;
    }
    for (var g = 0; g < config.groups.length; g++) {
      var group = config.groups[g];
      html += '<div class="admin-group-card">';
      html += '<div class="admin-group-header" data-group="' + g + '">';
      html += '<h4>' + escHtml(group.name) + ' <span style="opacity:0.4;font-weight:400;">(' + (group.members ? group.members.length : 0) + ')</span></h4>';
      html += '<div style="display:flex;gap:0.3rem;">';
      html += '<button class="btn-sm rename-group-btn" data-group="' + g + '">Rename</button>';
      html += '<button class="btn-sm danger delete-group-btn" data-group="' + g + '">Delete</button>';
      html += '</div></div>';
      html += '<div class="admin-group-body">';
      if (group.members && group.members.length > 0) {
        for (var m = 0; m < group.members.length; m++) {
          var member = group.members[m];
          html += '<div class="admin-member-row">';
          if (member.photo) {
            html += '<img src="' + escHtml(member.photo) + '" alt="" class="am-thumb" style="object-fit:cover;"/>';
          } else {
            html += '<div class="am-thumb" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:0.65rem;color:var(--accent);font-weight:700;">' + getInitials(member.name) + '</div>';
          }
          html += '<div class="am-info"><div class="am-name">' + escHtml(member.name) + '</div><div class="am-role">' + escHtml(member.role) + ' &middot; ' + escHtml(member.dept) + '</div></div>';
          html += '<div class="am-actions">';
          html += '<button class="btn-sm edit-member-btn" data-group="' + g + '" data-member="' + m + '">Edit</button>';
          html += '<button class="btn-sm danger delete-member-btn" data-group="' + g + '" data-member="' + m + '">Del</button>';
          html += '</div></div>';
        }
      } else {
        html += '<div style="font-size:0.7rem;color:var(--text);opacity:0.5;padding:0.5rem 0;">No members in this group.</div>';
      }
      html += '</div></div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.edit-member-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openMemberModal(parseInt(this.dataset.group), parseInt(this.dataset.member));
      });
    });
    container.querySelectorAll('.delete-member-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteMember(parseInt(this.dataset.group), parseInt(this.dataset.member));
      });
    });
    container.querySelectorAll('.rename-group-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openGroupModal(parseInt(this.dataset.group));
      });
    });
    container.querySelectorAll('.delete-group-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        deleteGroup(parseInt(this.dataset.group));
      });
    });
  }

  function deleteMember(gIdx, mIdx) {
    if (!confirm('Delete "' + config.groups[gIdx].members[mIdx].name + '"?')) return;
    config.groups[gIdx].members.splice(mIdx, 1);
    saveConfig();
    renderMembersList();
    showStatus('Member deleted');
  }

  function deleteGroup(gIdx) {
    if (!confirm('Delete group "' + config.groups[gIdx].name + '" and all its members?')) return;
    config.groups.splice(gIdx, 1);
    saveConfig();
    renderMembersList();
    showStatus('Group deleted');
  }

  // --- CROP HELPERS ---
  function resetCropUI() {
    if (cropper) { cropper.destroy(); cropper = null; }
    croppedDataUrl = null;
    document.getElementById('cropWrap').style.display = 'none';
    document.getElementById('cropActions').style.display = 'none';
    document.getElementById('cropPreview').style.display = 'none';
    document.getElementById('editPhotoInput').value = '';
  }

  function showCropPreview(dataUrl) {
    document.getElementById('previewImage').src = dataUrl;
    document.getElementById('cropPreview').style.display = 'flex';
  }

  function applyCrop() {
    if (!cropper) return;
    var canvas = cropper.getCroppedCanvas({ width: 180, height: 180 });
    croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    showCropPreview(croppedDataUrl);
    document.getElementById('cropWrap').style.display = 'none';
    document.getElementById('cropActions').style.display = 'none';
    if (cropper) { cropper.destroy(); cropper = null; }
    showStatus('Cropped photo applied! Will save with member.');
  }

  function getExistingPhotoUrl() {
    var gIdx = editingGroupIdx;
    var mIdx = editingMemberIdx;
    if (gIdx === null || mIdx === null) return null;
    var member = config.groups[gIdx].members[mIdx];
    return member.photo || null;
  }

  function loadExistingIntoCropper() {
    var photoUrl = getExistingPhotoUrl();
    if (!photoUrl) { showStatus('No photo to re-crop', true); return; }
    var img = document.getElementById('cropImage');
    img.src = photoUrl;
    document.getElementById('cropWrap').style.display = 'block';
    document.getElementById('cropActions').style.display = 'flex';
    document.getElementById('cropPreview').style.display = 'none';
    document.getElementById('currentPhotoLabel').textContent = '';
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, {
      aspectRatio: 1,
      viewMode: 1,
      autoCropArea: 0.85,
      minCropBoxWidth: 90,
      minCropBoxHeight: 90,
      zoomable: true,
      rotatable: true
    });
  }

  document.getElementById('recropBtn').addEventListener('click', loadExistingIntoCropper);

  function openMemberModal(gIdx, mIdx) {
    editingMemberIdx = mIdx;
    editingGroupIdx = gIdx;
    var member = config.groups[gIdx].members[mIdx];
    document.getElementById('memberModalTitle').textContent = 'Edit Member';
    document.getElementById('editName').value = member.name;
    document.getElementById('editRole').value = member.role;
    document.getElementById('editDept').value = member.dept;

    var sel = document.getElementById('editGroup');
    sel.innerHTML = '';
    for (var i = 0; i < config.groups.length; i++) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = config.groups[i].name;
      sel.appendChild(opt);
    }
    sel.value = gIdx;

    resetCropUI();
    if (member.photo) {
      if (member.photo.indexOf('data:') === 0) {
        showCropPreview(member.photo);
        document.getElementById('currentPhotoLabel').textContent = 'Cropped photo in config';
      } else {
        document.getElementById('currentPhotoLabel').textContent = 'Photo: ' + member.photo;
        document.getElementById('cropPreview').style.display = 'none';
      }
      document.getElementById('recropBtn').style.display = 'inline-block';
    } else {
      document.getElementById('currentPhotoLabel').textContent = 'No photo';
      document.getElementById('recropBtn').style.display = 'none';
    }

    document.getElementById('modalSaveBtn').onclick = saveMemberHandler;
    document.getElementById('memberModal').classList.add('active');
  }

  function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('active');
    if (cropper) { cropper.destroy(); cropper = null; }
  }

  document.getElementById('modalCancelBtn').addEventListener('click', closeMemberModal);

  // PHOTO UPLOAD
  document.getElementById('editPhotoInput').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var img = document.getElementById('cropImage');
      img.src = ev.target.result;
      document.getElementById('cropWrap').style.display = 'block';
      document.getElementById('cropActions').style.display = 'flex';
      document.getElementById('cropPreview').style.display = 'none';
      document.getElementById('currentPhotoLabel').textContent = '';
      if (cropper) cropper.destroy();
      cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 0.85,
        minCropBoxWidth: 90,
        minCropBoxHeight: 90,
        zoomable: true,
        rotatable: true
      });
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('applyCropBtn').addEventListener('click', applyCrop);

  document.getElementById('resetCropBtn').addEventListener('click', function() {
    if (cropper) cropper.reset();
  });

  document.getElementById('clearPhotoBtn').addEventListener('click', function() {
    if (editingMemberIdx !== null && editingGroupIdx !== null) {
      config.groups[editingGroupIdx].members[editingMemberIdx].photo = null;
      saveConfig();
      resetCropUI();
      document.getElementById('currentPhotoLabel').textContent = 'No photo';
      document.getElementById('cropPreview').style.display = 'none';
      showStatus('Photo removed');
      renderMembersList();
    }
  });

  // ADD MEMBER
  document.getElementById('addMemberBtn').addEventListener('click', function() {
    if (!config.groups || config.groups.length === 0) {
      showStatus('Add a group first', true);
      return;
    }
    editingMemberIdx = null;
    editingGroupIdx = null;
    document.getElementById('memberModalTitle').textContent = 'Add Member';
    document.getElementById('editName').value = '';
    document.getElementById('editRole').value = '';
    document.getElementById('editDept').value = '';

    var sel = document.getElementById('editGroup');
    sel.innerHTML = '';
    for (var i = 0; i < config.groups.length; i++) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = config.groups[i].name;
      sel.appendChild(opt);
    }

    resetCropUI();
    document.getElementById('currentPhotoLabel').textContent = 'No photo';
    document.getElementById('cropPreview').style.display = 'none';
    document.getElementById('recropBtn').style.display = 'none';

    document.getElementById('modalSaveBtn').onclick = function() {
      var name = document.getElementById('editName').value.trim();
      var role = document.getElementById('editRole').value.trim();
      var dept = document.getElementById('editDept').value.trim();
      var groupIdx = parseInt(document.getElementById('editGroup').value);
      if (!name) { showStatus('Name is required', true); return; }

      var photo = croppedDataUrl || null;

      config.groups[groupIdx].members.push({
        name: name,
        role: role,
        dept: dept,
        photo: photo
      });
      saveConfig();
      closeMemberModal();
      renderMembersList();
      showStatus('Member added');
      document.getElementById('modalSaveBtn').onclick = saveMemberHandler;
    };
    document.getElementById('memberModal').classList.add('active');
  });

  // SAVE HANDLER (edit mode)
  function saveMemberHandler() {
    var name = document.getElementById('editName').value.trim();
    var role = document.getElementById('editRole').value.trim();
    var dept = document.getElementById('editDept').value.trim();
    var newGroup = parseInt(document.getElementById('editGroup').value);
    if (!name) { showStatus('Name is required', true); return; }

    var member = config.groups[editingGroupIdx].members[editingMemberIdx];
    member.name = name;
    member.role = role;
    member.dept = dept;
    if (croppedDataUrl) {
      member.photo = croppedDataUrl;
    }

    if (newGroup !== editingGroupIdx) {
      config.groups[editingGroupIdx].members.splice(editingMemberIdx, 1);
      config.groups[newGroup].members.push(member);
    }

    saveConfig();
    closeMemberModal();
    renderMembersList();
    showStatus('Member saved');
  }
  document.getElementById('modalSaveBtn').onclick = saveMemberHandler;

  // GROUP MODAL
  function openGroupModal(gIdx) {
    editingGroupIdx = gIdx;
    document.getElementById('groupModalTitle').textContent = 'Rename Group';
    document.getElementById('editGroupName').value = config.groups[gIdx].name;
    document.getElementById('groupModal').classList.add('active');
  }

  document.getElementById('groupModalCancelBtn').addEventListener('click', function() {
    document.getElementById('groupModal').classList.remove('active');
  });

  document.getElementById('groupModalSaveBtn').addEventListener('click', function() {
    var name = document.getElementById('editGroupName').value.trim();
    if (!name) { showStatus('Group name is required', true); return; }
    if (editingGroupIdx !== null) {
      config.groups[editingGroupIdx].name = name;
    } else {
      config.groups.push({ name: name, members: [] });
    }
    saveConfig();
    document.getElementById('groupModal').classList.remove('active');
    renderMembersList();
    showStatus('Group saved');
  });

  document.getElementById('addGroupBtn').addEventListener('click', function() {
    editingGroupIdx = null;
    document.getElementById('groupModalTitle').textContent = 'Add Group';
    document.getElementById('editGroupName').value = '';
    document.getElementById('groupModal').classList.add('active');
  });

  // SETTINGS
  function loadSettings() {
    document.getElementById('setSiteTitle').value = config.site.title || '';
    document.getElementById('setSubtitle').value = config.site.subtitle || '';
    document.getElementById('setDesc').value = config.site.description || '';
    document.getElementById('setFooter').value = config.site.footer || '';
    document.getElementById('setAdminUser').value = config.admin.username || '';
    document.getElementById('setAdminPass').value = config.admin.password || '';
  }

  document.getElementById('saveSettingsBtn').addEventListener('click', function() {
    config.site.title = document.getElementById('setSiteTitle').value.trim();
    config.site.subtitle = document.getElementById('setSubtitle').value.trim();
    config.site.description = document.getElementById('setDesc').value.trim();
    config.site.footer = document.getElementById('setFooter').value.trim();
    config.admin.username = document.getElementById('setAdminUser').value.trim();
    config.admin.password = document.getElementById('setAdminPass').value;
    saveConfig();
    showStatus('Settings saved');
  });

  // EXPORT
  document.getElementById('exportBtn').addEventListener('click', function() {
    var jsContent = 'const CYBER_CLUB_CONFIG = ' + JSON.stringify(config, null, 2) + ';\n';
    var blob = new Blob([jsContent], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'members-config.js';
    link.click();
    URL.revokeObjectURL(url);
    showStatus('Config downloaded — replace js/members-config.js on server');
  });

  // --- GITHUB PUBLISH ---
  function loadGhSettings() {
    // Start with defaults from config
    var def = config.github || {};
    document.getElementById('ghToken').value = '';
    document.getElementById('ghOwner').value = def.owner || '';
    document.getElementById('ghRepo').value = def.repo || '';
    document.getElementById('ghPath').value = def.path || 'js/members-config.js';
    document.getElementById('ghMsg').value = def.msg || 'Update member data via admin panel';
    // Override with saved credentials
    var saved = localStorage.getItem('cyberclub_github');
    if (saved) {
      try {
        var s = JSON.parse(saved);
        if (s.token) document.getElementById('ghToken').value = s.token;
        if (s.owner) document.getElementById('ghOwner').value = s.owner;
        if (s.repo) document.getElementById('ghRepo').value = s.repo;
        if (s.path) document.getElementById('ghPath').value = s.path;
        if (s.msg) document.getElementById('ghMsg').value = s.msg;
      } catch(e) {}
    }
  }

  document.getElementById('saveGhSettingsBtn').addEventListener('click', function() {
    var gh = {
      token: document.getElementById('ghToken').value,
      owner: document.getElementById('ghOwner').value.trim(),
      repo: document.getElementById('ghRepo').value.trim(),
      path: document.getElementById('ghPath').value.trim(),
      msg: document.getElementById('ghMsg').value.trim()
    };
    localStorage.setItem('cyberclub_github', JSON.stringify(gh));
    showStatus('GitHub credentials saved locally');
  });

  loadGhSettings();

  function logPublish(msg, isError) {
    var el = document.getElementById('publishLog');
    el.style.display = 'block';
    el.innerHTML += (isError ? '❌ ' : '✅ ') + msg + '\n';
    el.scrollTop = el.scrollHeight;
    document.getElementById('publishStatus').textContent = isError ? 'Failed' : '';
  }

  function clearPublishLog() {
    document.getElementById('publishLog').innerHTML = '';
    document.getElementById('publishLog').style.display = 'none';
    document.getElementById('publishStatus').textContent = '';
  }

  document.getElementById('publishBtn').addEventListener('click', function() {
    var token = document.getElementById('ghToken').value;
    var owner = document.getElementById('ghOwner').value.trim();
    var repo = document.getElementById('ghRepo').value.trim();
    var path = document.getElementById('ghPath').value.trim();
    var msg = document.getElementById('ghMsg').value.trim();

    if (!token || !owner || !repo || !path) {
      showStatus('Fill in all GitHub fields first', true);
      return;
    }

    clearPublishLog();
    logPublish('Connecting to GitHub...');
    document.getElementById('publishStatus').textContent = 'Publishing...';

    var jsContent = 'const CYBER_CLUB_CONFIG = ' + JSON.stringify(config, null, 2) + ';\n';
    var contentEncoded = btoa(unescape(encodeURIComponent(jsContent)));

    // First, get the current file SHA
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + encodeURIComponent(path), true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('Accept', 'application/vnd.github+json');

    xhr.onload = function() {
      if (xhr.status === 200 || xhr.status === 404) {
        var sha = null;
        if (xhr.status === 200) {
          try {
            sha = JSON.parse(xhr.responseText).sha;
            logPublish('Found existing file (SHA: ' + sha.substring(0,7) + '...)');
          } catch(e) {
            logPublish('Could not parse existing file info', true);
            document.getElementById('publishStatus').textContent = 'Failed';
            return;
          }
        } else {
          logPublish('File does not exist yet — will create');
        }

        // PUT the new content
        var putBody = {
          message: msg,
          content: contentEncoded
        };
        if (sha) putBody.sha = sha;

        var xhr2 = new XMLHttpRequest();
        xhr2.open('PUT', 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + encodeURIComponent(path), true);
        xhr2.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr2.setRequestHeader('Accept', 'application/vnd.github+json');
        xhr2.setRequestHeader('Content-Type', 'application/json');

        xhr2.onload = function() {
          if (xhr2.status >= 200 && xhr2.status < 300) {
            logPublish('Committed to ' + owner + '/' + repo + '/' + path);
            logPublish('Netlify will auto-deploy in a few minutes');
            document.getElementById('publishStatus').textContent = 'Published!';
            document.getElementById('publishStatus').style.color = 'var(--accent)';
            showStatus('Published to GitHub! Netlify will deploy.');
          } else {
            var errMsg = 'GitHub error: ' + xhr2.status;
            try { var e = JSON.parse(xhr2.responseText); errMsg += ' — ' + (e.message || ''); } catch(ex) {}
            logPublish(errMsg, true);
            document.getElementById('publishStatus').textContent = 'Failed';
            showStatus('GitHub publish failed', true);
          }
        };

        xhr2.onerror = function() {
          logPublish('Network error — check your connection', true);
          document.getElementById('publishStatus').textContent = 'Failed';
          showStatus('Network error', true);
        };

        xhr2.send(JSON.stringify(putBody));
      } else {
        var errMsg = 'GitHub error: ' + xhr.status;
        try { var e = JSON.parse(xhr.responseText); errMsg += ' — ' + (e.message || ''); } catch(ex) {}
        logPublish(errMsg, true);
        document.getElementById('publishStatus').textContent = 'Failed';
        showStatus('GitHub fetch failed — check your token', true);
      }
    };

    xhr.onerror = function() {
      logPublish('Network error — check your connection', true);
      document.getElementById('publishStatus').textContent = 'Failed';
      showStatus('Network error', true);
    };

    xhr.send();
  });

})();
