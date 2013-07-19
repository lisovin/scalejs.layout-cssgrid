param($installPath, $toolsPath, $package, $project)

$project |
	Remove-Paths 'scalejs.layout-cssgrid' |
	Remove-ScalejsExtension 'scalejs.layout-cssgrid' |
	Out-Null
