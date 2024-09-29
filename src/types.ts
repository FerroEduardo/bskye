export interface ThreadViewPost {
	thread: {
		$type: string;
		post: {
			uri: string;
			cid: string;
			author: {
				did: string;
				handle: string;
				displayName: string;
				avatar: string;
				associated?: {
					chat: {
						allowIncoming: string;
					};
				};
				labels: any[];
				createdAt: string;
			};
			record: {
				$type: string;
				createdAt: string;
				embed?: {
					$type: string;
					aspectRatio?: {
						height: number;
						width: number;
					};
					video?: {
						$type: string;
						ref: {
							$link: string;
						};
						mimeType: string;
						size: number;
					};
					captions: [
						{
							file: {
								$type: string;
								ref: {
									$link: string;
								};
								mimeType: string;
								size: number;
							};
							lang: string;
						}
					];
					images?: [
						{
							alt: string;
							aspectRatio: {
								height: number;
								width: number;
							};
							image: {
								$type: string;
								ref: {
									$link: string;
								};
								mimeType: string;
								size: number;
							};
						}
					];
					external?: {
						description: string;
						thumb?: {
							$type: string;
							ref: {
								$link: string;
							};
							mimeType: string;
							size: number;
						};
						title: string;
						uri: string;
					};
				};
				facets?: [
					{
						$type?: string;
						features: [
							{
								$type: string;
								did: string;
							}
						];
						index: {
							byteEnd: number;
							byteStart: number;
						};
					}
				];
				langs: string[];
				text: string;
			};
			embed?: {
				$type: string;
				cid?: string;
				playlist?: string;
				thumbnail?: string;
				aspectRatio?: {
					height: number;
					width: number;
				};
				images?: [
					{
						thumb: string;
						fullsize: string;
						alt: string;
						aspectRatio: {
							height: number;
							width: number;
						};
					}
				];
			};
			replyCount: number;
			repostCount: number;
			likeCount: number;
			quoteCount: number;
			indexedAt: string;
			labels: any[];
		};
	};
}
