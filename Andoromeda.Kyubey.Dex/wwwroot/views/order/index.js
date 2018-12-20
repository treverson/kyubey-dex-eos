component.data = function () {
    return {
        openOrders: [],
        historyOrders: [],
        filterCurrent: [],
        openOrdersView: null,
        histroyOrdersView: null,
        control: {
            type: 'open'
        },
        search: {
            filterString: '',
            type: '',
            start: '',
            end: ''
        },
        pageTotal: 0,
        pageCount: 0,
        pageSize: 10,
        pageIndex: 1,
        jumpPage: ''
    };
};

component.created = function () {
    if (this.isSignedIn) {
        this.getOpenOrders();
        this.getHistroyOrders();
    }
};

component.mounted = function () { 
    $('.date-picker').datepicker({
        autoclose: true,
        todayHighlight: true,
        format: 'yyyy-mm-dd'
    });
}

component.methods = {
    formatTime(time) {
        return moment(time).format('MM-DD');
    },
    getOpenOrders() {
        var self = this;
        self.openOrdersView = qv.createView(`/api/v1/lang/${app.lang}/User/${app.account ? app.account.name : null}/current-delegate`, {});
        self.openOrdersView.fetch(res => {
            if (res.code === 200) {
                self.openOrders = res.data || [];
                self.filterCurrent = res.data || [];
            }
        })
    },
    getHistroyOrders(skip = 0) {
        let requestParams = {
            ...this.search,
            skip,
            take: this.pageSize
        }
        var self = this;
        self.histroyOrdersView = qv.createView(`/api/v1/lang/${app.lang}/User/${app.account ? app.account.name : null}/history-delegate`, requestParams);
        self.histroyOrdersView.fetch(res => {
            if (res.code === 200) {
                self.historyOrders = res.data.result || [];
                self.pageTotal = parseInt(res.data.total);
                self.pageCount = parseInt(res.data.count);
            }
        })
    },
    searchOrders() {
        this.search.start = $('.start-date').val() === '' ? '' : new Date($('.start-date').val() + ' 00:00:00').toISOString();
        this.search.end = $('.end-date').val() === '' ? '' : new Date($('.end-date').val() + ' 23:59:59').toISOString();
        this.pageIndex = 1;
        this.filterOpenOrders();
        this.getHistroyOrders();
    },
    handlePageChange(i) {
        this.pageIndex = i;
        this.getHistroyOrders((i-1)*this.pageSize);
    },
    next() {
        if (this.pageIndex < this.pageCount) {
            this.handlePageChange(this.pageIndex+1);
        }
    },
    prev() {
        if (this.pageIndex > 1) {
            this.handlePageChange(this.pageIndex-1);
        }
    },
    jump() {
        if(this.jumpPage < 1) {this.jumpPage = 1}
        if(this.jumpPage > this.pageCount) {this.jumpPage = this.pageCount}
        this.handlePageChange(parseInt(this.jumpPage));
    },
    filterOpenOrders() {
        let startTimestamp = new Date(this.search.start).getTime();
        let endTimestamp = new Date(this.search.end).getTime();
        this.filterCurrent = this.openOrders.filter(item => {
            let isSymbol = item.symbol.includes(this.search.filterString.toUpperCase());
            let isType = this.search.type === '' ? true : item.type === this.search.type;
            let timestamp = new Date(item.time).getTime();
            let isStartTime = this.search.start === '' ? true : startTimestamp <= timestamp 
            let isEndTime = this.search.end === '' ? true : timestamp <= endTimestamp;
            return isSymbol && isType && timestamp && isStartTime && isEndTime
        })
    }
};

component.computed = {
    isSignedIn: function () {
        return !(app.account == null || app.account.name == null);
    }
};

component.watch = {
    '$root.isSignedIn': function (val) {
        if (val === true) {
            this.getOpenOrders();
            this.getHistroyOrders();
        }
        //logout
        else {
            //comments: stop qv job or use signalR
        }
    },
    deep: true
}
