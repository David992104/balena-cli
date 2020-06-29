/**
 * @license
 * Copyright 2016-2020 Balena Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { flags } from '@oclif/command';
import { IArg } from '@oclif/parser/lib/args';
import Command from '../../command';
import * as cf from '../../utils/common-flags';
import { expandForAppName } from '../../utils/helpers';
import { getBalenaSdk, getVisuals, stripIndent } from '../../utils/lazy';
import { tryAsInteger } from '../../utils/validation';
import type { Application, Device } from 'balena-sdk';

interface ExtendedDevice extends Device {
	dashboard_url?: string;
	application_name?: string;
	commit?: string;
}

interface FlagsDef {
	help: void;
}

interface ArgsDef {
	uuid: string;
}

export default class DeviceCmd extends Command {
	public static description = stripIndent`
		Show info about a single device.

		Show information about a single device.
		`;
	public static examples = ['$ balena device 7cf02a6'];

	public static args: Array<IArg<any>> = [
		{
			name: 'uuid',
			description: 'the device uuid',
			parse: (dev) => tryAsInteger(dev),
			required: true,
		},
	];

	public static usage = 'device <uuid>';

	public static flags: flags.Input<FlagsDef> = {
		help: cf.help,
	};

	public static authenticated = true;
	public static primary = true;

	public async run() {
		const { args: params } = this.parse<FlagsDef, ArgsDef>(DeviceCmd);

		const balena = getBalenaSdk();

		const [device, overallStatus] = await Promise.all([
			balena.models.device.get(params.uuid, expandForAppName) as Promise<
				ExtendedDevice
			>,
			// TODO: drop this and add `overall_status` to a $select in the above
			// pine query once the overall_status field is moved to open-balena-api.
			// See: https://github.com/balena-io/open-balena-api/issues/338
			balena.models.device
				.get(params.uuid, { $select: 'overall_status' })
				.then(({ overall_status }) => overall_status)
				.catchReturn(''),
		]);
		device.status = overallStatus;

		device.dashboard_url = balena.models.device.getDashboardUrl(device.uuid);

		const belongsToApplication = device.belongs_to__application as Application[];
		device.application_name = belongsToApplication?.[0]
			? belongsToApplication[0].app_name
			: 'N/a';

		device.commit = device.is_on__commit;

		console.log(
			getVisuals().table.vertical(device, [
				`$${device.device_name}$`,
				'id',
				'device_type',
				'status',
				'is_online',
				'ip_address',
				'mac_address',
				'application_name',
				'last_seen',
				'uuid',
				'commit',
				'supervisor_version',
				'is_web_accessible',
				'note',
				'os_version',
				'dashboard_url',
			]),
		);
	}
}
