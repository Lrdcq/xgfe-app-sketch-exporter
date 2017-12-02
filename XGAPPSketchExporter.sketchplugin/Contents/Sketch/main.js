@import 'config.js'

var XGRE = {
    Helper : { //工具类
        getImage : function(context, name) { //获取插件资源文件中的图片资源
            return [[NSImage alloc] initWithContentsOfFile:context.plugin.urlForResourceNamed(name).path()];
        },
        _toolIcon : false,
        getToolIcon : function(context) { //获取图标(包括缓存)
            if (!this._toolIcon) {
                this._toolIcon = this.getImage(context, 'alertIcon.png');
            }
            return this._toolIcon;
        },
        hashFileName : function() { //获取当前项目文件的hash
            var str = [[MSDocument currentDocument] fileURL] + ''
            var hash = 0, i, chr;
            if (str.length === 0) return hash;
            for (i = 0; i < str.length; i++) {
                chr   = str.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0;
            }
            return hash;
        },
        alert : function(context, str) { //alert
            var alert = [[NSAlert alloc] init];
            [alert addButtonWithTitle:"确认"];
            [alert setMessageText:str + ''];
            [alert setAlertStyle:NSAlertStyleInformational];
            [alert setIcon:this.getToolIcon(context)];
            [alert runModal];
        }
    },
    ToolConfig : { //工具配置
        getToolConfig : function() {
            if (toolConfigs && toolConfigs.length) {
                return toolConfigs;
            } else {
                XGRE.Helper.alert(context, "工具配置加载错误");
                throw "工具配置加载错误";
            }
        }
    },
    Config : { //项目配置
        CONFIG_KEY_PREFIX : 'XGResourcesExporterConfig_',
        configData : {
            path : "",
            platform : -1,
            sizelist : [],
        },
        loadConfigData : function(context) {
            var key = this.CONFIG_KEY_PREFIX + XGRE.Helper.hashFileName();
            var json = [[NSUserDefaults standardUserDefaults] objectForKey:key];
            if (json && json.length) {
                this.configData = JSON.parse(json);
            }
        },
        saveConfigData : function(context) {
            var json = JSON.stringify(this.configData);
            var key = this.CONFIG_KEY_PREFIX + XGRE.Helper.hashFileName();
            [[NSUserDefaults standardUserDefaults] setObject:json forKey:key];
        },
        clearConfigData : function(context) {
            var key = this.CONFIG_KEY_PREFIX + XGRE.Helper.hashFileName();
            [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
        },
        openConfigUI : function(context) {
            //加载工具配置
            var toolConfig = XGRE.ToolConfig.getToolConfig();
            //加载项目配置
            this.loadConfigData();

            var alert = [[NSAlert alloc] init];
            [alert addButtonWithTitle:"确认"];
            [alert addButtonWithTitle:"取消"];
            [alert setMessageText:"配置该Sketch文件项目输出配置"];
            [alert setAlertStyle:NSAlertStyleInformational];
            [alert setIcon:XGRE.Helper.getToolIcon(context)];
    
            var contentView = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, 450, 120)];
            
            //地址选择

            var chooseText = [[NSTextField alloc] initWithFrame:NSMakeRect(110, 95, 320, 22)];
            var chooseTextStr = "请设置项目资源目录地址";
            if (this.configData.path && this.configData.path.length) {
                chooseTextStr = this.configData.path;
            }
            chooseText.stringValue = chooseTextStr;
            [[chooseText cell] setScrollable:true];
            [contentView addSubview:chooseText];

            var choose = [[NSButton alloc] initWithFrame:NSMakeRect(0, 90, 100, 30)];
            [choose setTitle:"选择目录"];
            [choose setBezelStyle:NSBezelStyleRounded];
            [choose setCOSJSTargetFunction:function () {
                var panel = [NSOpenPanel openPanel];
                panel.canCreateDirectories = true;
                panel.canChooseDirectories = true;
                panel.canChooseFiles = false;
                panel.setAllowsMultipleSelection = false;
                [panel runModal];

                var path = [panel URL] + '';
                path = path.substring(7);
                chooseText.stringValue = path;
            }];
            [contentView addSubview:choose];
    
            //平台选择

            var radioText = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 70, 320, 22)];
            radioText.stringValue = "请选择项目平台和输出图像类型:";
            radioText.editable = false;
            [radioText setDrawsBackground:false];
            [radioText setBordered:false];
            [contentView addSubview:radioText];

            var radio = [];
            for (var i = 0 ; i < toolConfig.length ; i++) {
                var r = [[NSButton alloc] initWithFrame:NSMakeRect(i * 100, 45, 150, 30)];
                var data = toolConfig[i];
                [r setTitle:data.platform + ''];
                [r setBezelStyle:NSBezelStyleRounded];
                [r setState:(data.id == this.configData.platform ? 1 : 0)];
                [r setButtonType:4];
                [r setCOSJSTargetFunction:function () {
                    sizeListBuild();
                }];
                [contentView addSubview:r];
                radio[i] = r;
            }

            //平台size构建
            var sizeListContent;
            var check = [];
            var sizeListBuild = function() {
                if (sizeListContent) {
                    [sizeListContent removeFromSuperview];
                }
                var goPlatform = -1;
                for (var j = 0 ; j < radio.length ; j++) {
                    var rr = radio[j];
                    if ([rr state]) {
                        goPlatform = j;
                        break;
                    }
                }
                if (goPlatform < 0) {
                    return;
                }
                var plat = toolConfig[goPlatform];
                XGRE.Config.configData.platform = (plat.id + '') * 1;

                //界面绘制
                sizeListContent = [[NSView alloc] initWithFrame:NSMakeRect(0, 0, 450, 50)];
                check = [];

                for (var i = 0 ; i < plat.sizelist.length ; i++) {
                    var iid = (plat.sizelist[i].id + plat.id * 1000) * 1;
                    var r = [[NSButton alloc] initWithFrame:NSMakeRect((i % 4) * 100, i >= 4 ? 0 : 20, 150, 30)];
                    var data = plat.sizelist[i];
                    [r setTitle:data.name + ''];
                    [r setBezelStyle:NSBezelStyleRounded];
                    [r setState:(XGRE.Config.configData.sizelist.indexOf(iid) > -1 ? 1 : 0)];
                    [r setButtonType:3];
                    [r setCOSJSTargetFunction:function () {
                        sizeListChange();
                    }];
                    [sizeListContent addSubview:r];
                    check[i] = r;
                }
                [contentView addSubview:sizeListContent];
            }
            sizeListBuild();

            //平台size改变
            var sizeListChange = function() {
                for (var i = 0 ; i < toolConfig.length ; i++) {
                    if (toolConfig[i].id == XGRE.Config.configData.platform) {
                        var plat = toolConfig[i];
                        var list = XGRE.Config.configData.sizelist ? XGRE.Config.configData.sizelist : [];
                        for (var j = 0 ; j < plat.sizelist.length ; j++) {
                            var iid = (plat.sizelist[j].id + plat.id * 1000) * 1;
                            var index = list.indexOf(iid);
                            var checked = [(check[j]) state];
                            if (index > -1) {
                                if (checked != 1) {
                                    list.splice(index, 1);
                                }
                            } else {
                                if (checked == 1) {
                                    list.push(iid);
                                }
                            }

                        }
                        XGRE.Config.configData.sizelist = list;
                        break;
                    }
                }
            }

            //

            [alert setAccessoryView:contentView];
    
            var action = [alert runModal];

            if (action == 1000) {
                var chooseTextValue = [chooseText stringValue];
                if (chooseTextValue.substring(0, 1) == '/') {
                    this.configData.path = chooseTextValue + '';
                }
                this.saveConfigData(context);
                return true;
            }
            return false;
        }
    },
    Exporter : {
        exporterConfigData : {
            platform : null,
            sizes : null,
            fileName : '',
            filePath : '',
            slice : null
        },
        checkConfig : function() {
            var d = XGRE.Config.configData;
            var c = XGRE.ToolConfig.getToolConfig();
            //是否有路径
            if (!(d.path && d.path.length && d.path.substring(0, 1) == '/')) {
                return false;
            }
            //是否有平台
            var foundPlat = false;
            for (var i = 0 ; i < c.length ; i++) {
                if (c[i].id == d.platform) {
                    foundPlat = true;
                    break;
                }
            }
            if (!foundPlat) {
                return false;
            }
            //平台下是否选择了size
            var foundSize = false;
            for (var i = 0 ; i < d.sizelist.length ; i++) {
                if (Math.floor(d.sizelist[i] / 1000) == d.platform) {
                    foundSize = true;
                    break;
                }
            }
            if (!foundSize) {
                return false;
            }
            //
            return true;
        },
        fillConfig : function(context) {//确认
            var d = XGRE.Config.configData;
            var c = XGRE.ToolConfig.getToolConfig();
            //获取实际输出size
            var sizeIds = [];
            for (var i = 0 ; i < d.sizelist.length ; i++) {
                if (Math.floor(d.sizelist[i] / 1000) == d.platform) {
                    sizeIds.push(d.sizelist[i] - 1000 * d.platform);
                }
            }
            if (sizeIds.length <= 0) {
                throw "发生错误：Selected Size Ids No Found";
            }
            var sizes = [];
            var plat = null;
            for (var i = 0 ; i < c.length ; i++) {
                if (c[i].id == d.platform) {
                    plat = c[i];
                    break;
                }
            }
            if (!plat) {
                throw "发生错误：Tool Platform Config No Found";
            }
            for (var i = 0 ; i < plat.sizelist.length ; i++) {
                if (sizeIds.indexOf(plat.sizelist[i].id) > -1) {
                    sizes.push(plat.sizelist[i]);
                }
            }
            if (sizes.length <= 0) {
                throw "发生错误：Tool Size Config No Found";
            }
            this.exporterConfigData.platform = plat;
            this.exporterConfigData.sizes = sizes;
            this.exporterConfigData.filePath = d.path;
        },
        fillSlice : function(context) {
            //检查选择对象
            var selections = context.selection;
            if ([selections count] <= 0) {
                throw "没有选择输出对象：Selection No Found";
            }
            var slices = [MSExportRequest exportRequestsFromExportableLayer:selections[0]];
            if ([slices count] <= 0) {
                throw "没有选择输出对象：Slice No Found";
            }
            this.exporterConfigData.slice = slices[0];
        },
        fillNameUI : function(context) {
            var alert = [[NSAlert alloc] init];
            [alert addButtonWithTitle:"确认"];
            [alert addButtonWithTitle:"取消"];
            [alert setMessageText:"请输入导出资源名称:"];
            [alert setAlertStyle:NSAlertStyleInformational];
            [alert setIcon:XGRE.Helper.getToolIcon(context)];
    
            var chooseText = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 0, 200, 22)];
            [[chooseText cell] setScrollable:true];
            [alert setAccessoryView:chooseText];
        
            [chooseText becomeFirstResponder];
            var action = [alert runModal];

            if (action == 1000) {
                var name = [chooseText stringValue];
                this.exporterConfigData.fileName = name + '';
                if (this.exporterConfigData.fileName.length <= 0) {
                    this.fillNameUI(context);
                }
                return;
            }
            throw "";
        },
        runExport : function(context) {
            var doc = context.document;
            var data = this.exporterConfigData;
            try {
                if (data.platform.willExport) {
                    data.platform.willExport(context, data);
                }
                for (var i = 0 ; i < data.sizes.length ; i++) {
                    var s = data.sizes[i];
                    var file = data.filePath + s.file;
                    file = file.replace(/{name}/g, data.fileName);
                    file = file.replace("//", "/");
                    var slice = data.slice;
                    slice.scale = s.scale;
                    [doc saveArtboardOrSlice:slice toFile:file];
                }
                if (data.platform.didExport) {
                    data.platform.didExport(context, data);
                }
                XGRE.Helper.alert(context, "导出成功");
            } catch (err) {
                if (data.platform.catchError) {
                    data.platform.catchError(context, data, err);
                }
                XGRE.Helper.alert(context, "导出错误：" + err);
            }
        },
        export : function(context) {
            XGRE.Config.loadConfigData(context);
            //确认配置是否完整
            var cancel = false;
            if (!this.checkConfig()) {
                XGRE.Helper.alert(context, "请配置该项目资源输出");
                do {
                    cancel = !XGRE.Config.openConfigUI(context);
                    if (cancel) {
                        return;
                    }
                } while(!this.checkConfig());
            }
            //填充数据并输出
            try {
                this.fillConfig(context);
                this.fillSlice(context);
                this.fillNameUI(context);

                this.runExport(context);
            } catch(str) {
                if (str && str.length) {
                    XGRE.Helper.alert(context, str);
                }
            }
        }
    }
};

var commandExport = function (context) {
    XGRE.Exporter.export(context);
}

var commandSetting = function (context) {
    XGRE.Config.openConfigUI(context);
}