param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.layout-cssgrid' : 'Scripts/scalejs.layout-cssgrid-$($package.Version)',
		'cssParser': 'Scripts/cssParser',
		'CSS.supports': 'Scripts/CSS.supports',
		'domReady': 'Scripts/domReady'
	}" |
	Add-Shims "{
		'CSS.supports'			: {
			exports: 'CSS'
		},
		'cssParser': {
			exports: 'cssParser'
		}
	}" |
	Add-ScalejsExtension 'scalejs.layout-cssgrid' |
	Out-Null