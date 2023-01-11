import { readDir, BaseDirectory } from '@tauri-apps/api/fs';

type Dir = {
	name: string;
	path: string;
	children?: Dir[];
};
export async function getInstalledPackages() {
	const packageFolders = (await readDir('.tea/', {
		dir: BaseDirectory.Home,
		recursive: true
	})) as Dir[];

	const pkgs = packageFolders
		.filter((p) => p.name !== 'tea.xyz')
		.map(getPkgBottles)
		.filter((pkgBottles) => pkgBottles.length)
		.map((pkgBottles) => {
			const versions = pkgBottles.map((v) => v.split('/v')[1]);
			const full_name = pkgBottles[0].split('/v')[0];

			const isSemverVersion = versions.filter((v) => semverTest.test(v));
			const isNotAsterisk = versions.filter((v) => v !== '*');
			const version =
				(isSemverVersion.length && isSemverVersion[0]) ||
				(isNotAsterisk.length && isNotAsterisk[0]) ||
				'*';
			return {
				version,
				full_name
			};
		});
	return pkgs;
}

const semverTest =
	/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/g;

const getPkgBottles = (packageDir: Dir): string[] => {
	let bottles: string[] = [];

	const pkg = packageDir.path.split('.tea/')[1];
	const version = pkg.split('/v')[1];

	const isVersion = semverTest.test(version) || !isNaN(+version) || version === '*';

	if (version && isVersion) {
		bottles.push(pkg);
	} else if (!version && packageDir.children?.length) {
		const childBottles = packageDir.children
			.map((dir) => {
				return getPkgBottles(dir).flatMap((v) => v);
			})
			.map((b) => b[0]);

		bottles = [...bottles, ...childBottles].filter((b) => b);
	}

	return bottles; // ie: ["gohugo.io/v*", "gohugo.io/v0", "gohugo.io/v0.108", "gohugo.io/v0.108.0"]
};
