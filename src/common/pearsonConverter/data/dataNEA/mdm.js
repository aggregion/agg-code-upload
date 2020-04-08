var aggvars = {};

var isMac = navigator.userAgent.toLowerCase().indexOf('mac os') !== -1;
var useProxy = false;
var alertError = false;

function getFunction(name, path) {
    var prefix = "mdm_";
    if (path) {
        prefix += path + "_";
    }
    var funcName = prefix + name;
    if (this.aggregion !== undefined) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            alertLog('function call ' + funcName + ': ' + arguments + '; ' + args);
            aggvars.mdmFunction = {
                funcName: funcName,
                funcArgs: args[1],
                rawArgs: JSON.stringify(args)
            };
            alertLog('aggvars.mdmFunction ' + JSON.stringify(aggvars.mdmFunction));
            return isMac ? aggregion.mdmFunction() : aggregion.mdmFunction(funcName, args[1]);
        }
    } else {
        console.log('no function found ' + funcName);
        return function () {
            var args = Array.prototype.slice.call(arguments);
            alertLog('no function found ', funcName, args);
            return "true";
        }
    }
}

var alertOut = null;

window.onload = function () { alertOut = document.getElementById('alertOut');}

function alertLog(msg) {
    if (alertOut && alertError) {
        alertOut.value += msg + '\n';
    }
}


var knownFunctions = [
    'mdm_hasEI',
    'mdm_initialise',
    'mdm_initforms',
    'mdm_Dialogs_prompt',
    'mdm_Dialogs_promptModal',
    'mdm_Dialogs_BrowseFile_show',
    'mdm_Dialogs_BrowseFolder_show',
    'mdm_Dialogs_BrowseFileUnicode_show',
    'mdm_Dialogs_BrowseFileToSave_show',
    'mdm_FileSystem_folderExists',
    'mdm_FileSystem_fileExists',
    'mdm_FileSystem_makeFolder',
    'mdm_FileSystem_saveFileUnicode',
    'mdm_FileSystem_copyFile',
    'mdm_FileSystem_getFileList',
    'mdm_FileSystem_getFolderList',
    'mdm_FileSystem_deleteFile',
    'mdm_FileSystem_deleteFolder',
    'mdm_System_exec',
    'mdm_System_getResolution',
    'mdm_Forms_getwidth',
    'mdm_Forms_getheight',
    'mdm_Forms_getx',
    'mdm_Forms_gety',
    'mdm_Forms_setwidth',
    'mdm_Forms_setheight',
    'mdm_Forms_getFormByName',
    'mdm_Application_createForm',
    'mdm_Application_collectEvents',
    'mdm_Application_init',
    'mdm_System_Paths_get-personal',
    'mdm_FileSystem_BinaryFile_setData',
    'mdm_FileSystem_BinaryFile_writeData'
];

var mdmBase = {};

function checkPropExists(prop) {
    var found = false;
    knownFunctions.forEach(function (f) {
        if (f.indexOf(prop) !== -1) {
            found = true;
        }
    });
    if (!found) {
        alertLog('NOT FOUND PROP!!! ' + prop);
    }
}

var proxyHandler = {
    get(target, prop) {
        if (initialized && alertError && prop !== 'Application' && prop !== 'collectEvents' && typeof prop === 'string') {
            alertLog(`Read ${prop}`);
            checkPropExists(prop);
        }
        return target[prop];
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    }
};

var initialized = false;
var functionsMap = {};

for (var i = 0; i < knownFunctions.length; i++) {
    var functionName = knownFunctions[i];
    var splitted = functionName.split('_');
    var obj = mdmBase;
    for (var j = 1; j < splitted.length - 1; j++) {
        var path = splitted[j];
        if (!obj[path]) {
            var newObj = {};
            obj[path] = useProxy ? new Proxy(newObj, proxyHandler) : newObj;
        }
        obj = obj[path];
    }
    var funcBaseName = splitted[splitted.length - 1];
    var funcPath = splitted.slice(1,-1).join('_');
    var func = getFunction(funcBaseName, funcPath);
    obj[splitted[splitted.length - 1]] = func;
    functionsMap[functionName.replace(/_/g, '.').replace(/-/g, '_')] = func;
}

var mdm = useProxy ? new Proxy(mdmBase, proxyHandler) : mdmBase;

function DcsOnCommand(p1, formId, p2, dataBase64) {
    var data = JSON.parse(atob(dataBase64));
    alertLog('DcsOnCommand: ' + p1 + '; ' +  formId + '; '  + p2 + '; ' + JSON.stringify(data));
    var funcName = data[0];
    var func = functionsMap[funcName];
    if (func) {
        alertLog('Function found: ' + funcName);
        var funcResult = func.apply(this, [funcName, data.slice(2).map(function (a) { return JSON.stringify(a);}).join()]);
        alertLog('FUNC RESULT :' + funcResult);
        return btoa(funcResult);
    } else {

    }
}


initialized = true;
