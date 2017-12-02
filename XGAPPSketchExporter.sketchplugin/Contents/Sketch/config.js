var toolConfigs = [
{
	id : 1,
	platform : 'Android',
	sizelist : [
	{
		id : 1,
		name : 'ldpi(0.75x)',
		scale : 0.375,
		file : '/drawable-ldpi/{name}.png'
	},
	{
		id : 2,
		name : 'mdpi(1x)',
		scale : 0.5,
		file : '/drawable-mdpi/{name}.png'
	},
	{
		id : 3,
		name : 'hdpi(1.5x)',
		scale : 0.75,
		file : '/drawable-hdpi/{name}.png'
	},
	{
		id : 4,
		name : 'xhdpi(2x)',
		scale : 1,
		file : '/drawable-xhdpi/{name}.png'
	},
	{
		id : 5,
		name : 'xxhdpi(3x)',
		scale : 1.5,
		file : '/drawable-xxhdpi/{name}.png'
	},
	{
		id : 6,
		name : 'xxxhdpi(4x)',
		scale : 2,
		file : '/drawable-xxxhdpi/{name}.png'
	}
	]
},
{
	id : 2,
	platform : 'iOS',
	sizelist : [
	{
		id : 1,
		name : '@1x',
		scale : 0.5,
		file : '/{name}.imageset/{name}@1x.png'
	},
	{
		id : 2,
		name : '@2x',
		scale : 1,
		file : '/{name}.imageset/{name}@2x.png'
	},
	{
		id : 3,
		name : '@3x',
		scale : 1.5,
		file : '/{name}.imageset/{name}@3x.png'
	}
	],
	didExport : function(context, exportConfig) {
		//输出Contents.json文件
		var contentFile = (exportConfig.filePath + '/' + exportConfig.fileName + '.imageset/Contents.json').replace("//", "/");
		var json = {
			"images" : [
    		{
      			"idiom" : "universal",
      			"scale" : "1x"
    		},
    		{
      			"idiom" : "universal",
      			"scale" : "2x"
    		},
    		{
      			"idiom" : "universal",
      			"scale" : "3x"
    		}],
  			"info" : {
   				"version" : 1,
    			"author" : "xcode"
  			}
		};
		for (var i = 0 ; i < this.sizelist.length ; i++) {
			if (exportConfig.sizes.indexOf(this.sizelist[i]) >= 0) {
				json.images[i].filename = exportConfig.fileName + '@' + json.images[i].scale + '.png';
			}
		}
		var data = [[NSString stringWithString:JSON.stringify(json)] dataUsingEncoding:4];//NSUTF8StringEncoding
		[data writeToFile:contentFile atomically:false];
	}
}
];