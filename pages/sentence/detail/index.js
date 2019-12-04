// pages/sentence/detail/index.js
const app = getApp();
import {
	GET_SENTEMCE_DETAIL,
	UPDATE_USER_COLLECT,
	GET_WX_QRCODE,
	LOADFAIL
} from "../../../apis/request";
let until = require("../../../utils/util");
const canvas = require("../../../utils/canvas");
let authLogin = require("../../../utils/authLogin");
let findTimeOut = null;
let bg_image = "";
let filePath = "";
let codePath = "";
Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		user_id: 0,
		author: null,
		sentence: null,
		poem: null,
		types: [],
		themes: [],
		collect_status: false,
		is_loading: true,
		animationData: {},
		filePath: null,
		pixelRatio: 1,
		canvas_img: null,
		is_show: "visible",
		is_load: false,
		show_canvas: false,
		is_ipx: app.globalData.isIpx,
		dialogShow: false,
	},
	dialogSave: function(params) {
		this.setData({
			dialogShow: false
		})
	},
	dialogCancel: function() { 
		this.setData({
			dialogShow: false,
			show_canvas: false
		})
	},
	// 获取用户id
	getUserId: function() {
		let user = wx.getStorageSync("user");
		let user_id = user ? user.user_id : 0;
		this.setData({
			user_id: user_id
		});
	},
	// 返回启动页
	return: function() {
		wx.switchTab({
			url: "/pages/index"
		});
	},
	// new find
	addNew: function() {
		let that = this;
		if (that.data.user_id < 1) {
			authLogin.authLogin(
				"/pages/poem/detail/index?id=" + that.data.poem.id,
				"nor",
				app
			);
		} else {
			wx.navigateTo({
				url: "/pages/find/new/index?type=poem&id=" + that.data.poem.id
			});
		}
	},
	// 复制文本内容
	copy: function() {
		let sentence = this.data.sentence;
		let _data = sentence.title;
		wx.setClipboardData({
			data: _data,
			success: function(res) {
				wx.getClipboardData({
					success: function(res) {
						wx.showToast({
							title: "诗词复制成功",
							icon: "success",
							duration: 2000
						});
					}
				});
			}
		});
	},
	// 获取诗词详情
	getSentenceDetail: function(sentence_id, user_id) {
		let that = this;
		const data = {
			id: sentence_id,
			user_id
		};
		//结果以Promise形式返回
		GET_SENTEMCE_DETAIL("GET", data)
			.then(res => {
				if (res.data && res.succeeded) {
					if (res.data.sentence) {
						res.data.sentence.title_arr = that.splitSentence(
							res.data.sentence.title
						);
					}
					that.setData({
						sentence: res.data.sentence,
						author: res.data.author,
						poem: res.data.poem,
						collect_status: res.data.sentence.collect_status,
						is_loading: false,
						types:
							res.data.sentence.type && res.data.sentence.type != ""
								? res.data.sentence.type.split(",")
								: [],
						themes:
							res.data.sentence.theme && res.data.sentence.theme != ""
								? res.data.sentence.theme.split(",")
								: []
					});
					bg_image = res.data.bg_image;
					wx.setNavigationBarTitle({
						title: res.data.sentence.origin
					});
				} else {
					LOADFAIL();
				}
				wx.hideLoading();
				wx.stopPullDownRefresh();
				that.getCodeImage("sentence", sentence_id);
			})
			.catch(err => {
				console.log(err);
				LOADFAIL();
			});
	},
	// 拆分词句
	splitSentence: function(sentence) {
		// 替代特殊符号 。。
		let pattern = new RegExp("[。，.、!！]", "g");
		sentence = sentence.replace(/，/g, ",");
		sentence = sentence.replace(pattern, ",");
		return sentence.split(",").filter(item => {
			return item;
		});
	},
	// context.font="italic small-caps bold 12px arial";
	// canvas 画图
	drawImage: function(file_path) {
		let that = this;
		let pixelRatio = that.data.pixelRatio;
		let winWidth = that.data.winWidth;
		let winHeight = that.data.winHeight;
		let filePath = file_path ? file_path : filePath;
		let date = until.formatDate();
		const scale = 1 / pixelRatio;
		const ctx = wx.createCanvasContext("myCanvas");
		// 全局设置
		// ctx.setGlobalAlpha(0.8);
		let font_size = 18 * pixelRatio + "px";
		ctx.font = "normal normal normal " + font_size + " Microsoft YaHei";
		// 背景图
		// ctx.drawImage(
		// 	filePath,
		// 	0,
		// 	0,
		// 	winWidth * pixelRatio,
		// 	winHeight * pixelRatio
		// );
		canvas.drawRect(
			ctx,
			0,
			0,
			winWidth * pixelRatio,
			winHeight * pixelRatio,
			'#fff'
		)
		// 左上角文字框
		canvas.drawRect(
			ctx,
			20 * pixelRatio,
			0,
			80 * pixelRatio,
			50 * pixelRatio,
			"rgba(0,0,0,0.4)"
		);
		// 日期
		font_size = 16 * pixelRatio + "px";
		canvas.drawText(
			ctx,
			"戊戌年",
			60 * pixelRatio,
			20 * pixelRatio,
			"center",
			"#fff",
			60 * pixelRatio,
			"normal normal normal " + font_size + " sans-serif"
		);
		canvas.drawText(
			ctx,
			date[1] + "-" + date[2],
			60 * pixelRatio,
			40 * pixelRatio,
			"center",
			"#fff",
			60 * pixelRatio,
			"normal normal normal " + font_size + " sans-serif"
		);
		// 正文
		font_size = 14 * pixelRatio + "px";
		console.log("normal normal normal " + font_size + ' "Microsoft YaHei""');
		// 诗词内容
		let text_y = 40 + 20 + 15;
		// 底部白框
		canvas.drawRect(
			ctx,
			0,
			(winHeight - 145 - text_y / 2) * pixelRatio,
			winWidth * pixelRatio,
			winHeight * pixelRatio,
			"rgba(255,255,255,0.8)"
		);
		// 正文框
		canvas.drawRect(
			ctx,
			20 * pixelRatio,
			(winHeight - 140 - text_y) * pixelRatio,
			(winWidth - 40) * pixelRatio,
			text_y * pixelRatio,
			"rgba(255,255,255,0.9)"
		);
		// 标题
		font_size = 18 * pixelRatio + "px";
		canvas.drawText(
			ctx,
			that.data.sentence.title,
			(winWidth * pixelRatio) / 2,
			(winHeight - 110 - text_y) * pixelRatio,
			"center",
			"#333",
			(winWidth - 80) * pixelRatio,
			"normal normal bold " + font_size + " sans-serif"
		);
		// 作者
		font_size = 14 * pixelRatio + "px";
		let author = that.data.poem.author + " | " + that.data.poem.dynasty;
		canvas.drawText(
			ctx,
			author,
			(winWidth * pixelRatio) / 2,
			(winHeight - 85 - text_y) * pixelRatio,
			"center",
			"#808080",
			(winWidth - 90) * pixelRatio,
			"normal normal bold " + font_size + " sans-serif"
		);
		// 二维码左侧文字
		// ctx.font = 15*pixelRatio+'px';
		ctx.fillStyle = "#333";
		ctx.setTextAlign("center");
		ctx.fillText(
			"更多古诗词内容",
			((winWidth - 130) / 2) * pixelRatio,
			(winHeight - 55) * pixelRatio
		);
		ctx.fillText(
			"长按二维码进入",
			((winWidth - 130) / 2) * pixelRatio,
			(winHeight - 35) * pixelRatio
		);
		// 二维码
		let codePath = codePath ? codePath : "/images/xcx1.jpg";
		let img_width = 30;
		let img_x = winWidth - 135;
		let img_y = winHeight - 80;
		canvas.drawCircleImage(
			ctx,
			(img_width + 5) * pixelRatio,
			img_width * 2 * pixelRatio,
			(img_x + 30) * pixelRatio,
			(img_y + 30) * pixelRatio,
			img_x * pixelRatio,
			img_y * pixelRatio,
			codePath
		);
		// 缩放
		ctx.scale(scale, scale);
		// 画图
		ctx.draw(true, () => {
			console.log("画图结束，生成临时图...");
			wx.canvasToTempFilePath({
				x: 0,
				y: 0,
				width: winWidth * pixelRatio,
				height: winHeight * pixelRatio,
				destWidth: winWidth * 2,
				destHeight: winHeight * 2,
				canvasId: "myCanvas",
				success(res) {
					console.log(res);
					that.setData({
						is_show: "hidden",
						show_canvas: "visible",
						canvas_img: res.tempFilePath,
						is_load: true
					});
					wx.hideLoading();
					console.log(res.tempFilePath);
				}
			});
		});
	},
	// canvas 生成临时图
	canvasToImage: function() {
		console.log("---click---me");
		let that = this;
		that.setData({
			show_canvas: true,
			dialogShow: true
		});
		if (!that.data.canvas_img) {
			wx.showLoading({
				title: "图片生成中..."
			});
			until
				.downImage(bg_image)
				.then(res => {
					console.log("背景图片下载完成---");
					if (res && res.succeeded) {
						filePath = res.tempFilePath;
						console.log("canvas 画图中...");
						that.drawImage(res.tempFilePath);
					}
				})
				.catch(error => {
					console.log(error);
					LOADFAIL()
				});
		}
	},
	// 保存图片到本地
	saveImage: function() {
		let that = this;
		let file_path = this.data.canvas_img;
		wx.showLoading({
			title: "正在保存图片..."
		});
		wx.saveImageToPhotosAlbum({
			filePath: file_path,
			success(res) {
				console.log(res);
				console.log("图片保存完成");
				wx.hideLoading();
				wx.showToast({
					title: "成功保存到系统相册",
					icon: "none",
					duration: 2000
				});
				setTimeout(() => {
					that.setData({
						show_canvas: false
					});
				}, 2000);
			},
			fail: res => {
				console.log(res);
				wx.hideLoading();
			}
		});
	},
	notSaveImage: function() {
		this.setData({
			show_canvas: false
		});
	},
	// 获取小程序码
	getCodeImage: function(type, id) {
		let _type = type ? type : "sentence";
		let path = "";
		let data = {
			type: _type,
			target_id: id,
			path: path,
			width: 300,
			id: id
		};
		GET_WX_QRCODE('GET',data)
			.then(res => {
				if (res.data && res.succeeded) {
					// 下载小程序码都本地
					until.downImage(res.data.file_name).then(res1 => {
						console.log(res1.tempFilePath);
						if (res1 && res1.succeeded) {
							codePath = res1.tempFilePath;
						}
					});
				} else {
					LOADFAIL();
				}
			})
			.catch(error => {
				console.log(error);
				LOADFAIL();
			});
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function(options) {
		let that = this;
		wx.showLoading({
			title: "页面加载中...",
			mask: true
		});
		this.getUserId();
		//  高度自适应
		wx.getSystemInfo({
			success: function(res) {
				let clientHeight = res.windowHeight,
					clientWidth = res.windowWidth,
					rpxR = 750 / clientWidth;
				let calc = clientHeight * rpxR - 180;
				// console.log(calc)
				that.setData({
					winHeight1: calc,
					pixelRatio: res.pixelRatio,
					winHeight: clientHeight,
					winWidth: clientWidth
				});
			}
		});
		that.getSentenceDetail(options.id, that.data.user_id);
	},
	// 更新收藏情况
	updateCollect: function() {
		let that = this;
		const data = {
			id: that.data.sentence.id,
			type: 'sentence',
			user_id: that.data.user_id,
		 }
		if (that.data.user_id < 1) {
			authLogin.authLogin(
				"/pages/poem/detail/index?id=" + that.data.sentence.id,
				"nor",
				app
			);
		} else {
			UPDATE_USER_COLLECT('GET',data)
				.then(res => {
					if (res.data && res.succeeded) {
						that.setData({
							collect_status: res.data.status
						});
					} else {
						that.setData({
							collect_status: res.data.status
						});
					}
				})
				.catch(error => {
					console.log(error);
					LOADFAIL();
				});
		}
	},
	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function() {
		wx.hideLoading();
	},
	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function() {
		let animation = wx.createAnimation({
			transformOrigin: "50% 50%",
			duration: 500,
			timingFunction: "ease",
			delay: 0
		});
		animation.scale(1.3, 1.3).step();
		this.setData({
			animationData: animation.export()
		});
		findTimeOut = setTimeout(
			function() {
				animation.scale(1, 1).step();
				this.setData({
					animationData: animation.export()
				});
			}.bind(this),
			500
		);
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function() {
		clearTimeout(findTimeOut);
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function() {
		clearTimeout(findTimeOut);
	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function() {
		wx.showLoading({
			title: "刷新中...",
			mask: true
		});
		let that = this;
		this.getUserId();
		that.setData({
			is_loading: true
		});
		that.getSentenceDetail(that.data.sentence.id, that.data.user_id);
	},
	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function() {
		let that = this;
		return {
			title: that.data.poem.title,
			path: "/pages/sentence/detail/index?id=" + that.data.sentence.id,
			// imageUrl:'/images/poem.png',
			success: function(res) {
				// 转发成功
				console.log("转发成功！");
			},
			fail: function(res) {
				// 转发失败
			}
		};
	}
});
