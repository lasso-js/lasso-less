var CONTEXT_ATTRIBUTE_KEY = 'raptor-theming';



function LessContext(optimizerContext) {
    this.optimizerContext = optimizerContext;
    this.lessDependencies = [];
    this.rendererAdded = false;
}

LessContext.prototype = {

    addLessDependency: function(d) {
        this.lessDependencies.push(d);
    },

    getLessRendererDependencyAdded: function() {
        return this.rendererAdded;
    },

    setLessRendererDependencyAdded: function() {
        this.rendererAdded = true;
    },

    getLessDependencies: function() {
        return this.lessDependencies;
    }
};

LessContext.getLessContext = function(optimizerContext) {
    var themingContext = optimizerContext.data[CONTEXT_ATTRIBUTE_KEY] ||
        (optimizerContext.data[CONTEXT_ATTRIBUTE_KEY] = new LessContext(optimizerContext));
    return themingContext;
};

module.exports = LessContext;