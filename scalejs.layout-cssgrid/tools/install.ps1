param($installPath, $toolsPath, $package, $project)

$project |
	Add-Paths "{
		'scalejs.layout-cssgrid' : 'Scripts/scalejs.layout-cssgrid-$($package.Version)',
		'cssparser': 'Scripts/cssparser',
		'CSS.supports': 'Scripts/CSS.supports',
		'domReady': 'Scripts/domReady'
	}" |
	Add-Shims "{
		'CSS.supports'			: {
			exports: 'CSS'
		}
	}" |
	Add-ScalejsExtension 'scalejs.layout-cssgrid' |
	Out-Null