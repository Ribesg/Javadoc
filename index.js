var path = require('path');
var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express();

var ignoredRegex = /^(?:node_modules|.git)$/;
var snapRegex = /-SNAPSHOT$/;

app.set('view engine', 'jade');
app.set('views', __dirname);

app.use(express.compress());
app.use(app.router);

console.log("Adding all folders in " + __dirname + " to statics...");
fs.readdirSync(__dirname).forEach(function(file) {
  console.log("  Found file " + file + ", checking if it's a folder");
  if (fs.statSync(path.join(__dirname, file)).isDirectory()) {
    if (ignoredRegex.test(file)) {
      console.log("    It's a folder but we ignore this one");
    } else {
      console.log("    It's a folder, adding it to statics");
      app.use('/' + file, express.static(path.join(__dirname, file)));
    }
  }
});
console.log("Done.");

app.get('/index.css', function(req, res) {
  res.sendfile(path.join(__dirname, 'index.css'));
}); 

app.get('/', function(req, res) {
  var projects;
  fs.readdirSync(__dirname).forEach(function(projectName) {
    if (fs.statSync(path.join(__dirname, projectName)).isDirectory() && !ignoredRegex.test(projectName)) {
      var project = {
        name: projectName
      }
      fs.readdirSync(path.join(__dirname, projectName)).forEach(function(version) {
        if (snapRegex.test(version)) {
          if (!project.snapshot || version > project.snapshot) {
            project.snapshot = version;
          }
        } else {
          if (project.releases) {
            project.releases.push(version);
          } else {
            project.releases = [ version ];
          }
        }
      });
      if (project.releases) {
        project.releases.sort();
        project.releases.reverse();
      }
      if (project.releases && project.snapshot && project.releases[0] + "-SNAPSHOT" >= project.snapshot) {
        delete project.snapshot;
      }
      if (projects) {
        projects.push(project);
      } else {
        projects = [ project ];
      }
    }
  });
  res.render('index', {
    projects: projects
  });
});

app.listen(3004);
console.log('Running...');
