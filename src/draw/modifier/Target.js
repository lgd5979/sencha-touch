/**
 * This is the destination modifier that has to be put at
 * the top of the modifier stack.
 *
 * Performance critical
 */
Ext.define("Ext.draw.modifier.Target", {
    extend: "Ext.draw.modifier.Modifier",
    alias: 'modifier.target',
    statics: {
        uniqueId: 0
    },
    prepareAttributes: function (attr) {
        if (this._previous) {
            this._previous.prepareAttributes(attr);
        }
        // TODO: Investigate the performance hit for introducing an id
        attr.attributeId = 'attribute-' + Ext.draw.modifier.Target.uniqueId++;
        if (!attr.hasOwnProperty('canvasAttributes')) {
            attr.bbox = {
                plain: {dirty: true},
                transform: {dirty: true}
            };
            attr.dirty = true;
            attr.dirtyFlags = {};
            attr.canvasAttributes = {};
            attr.matrix = new Ext.draw.Matrix();
            attr.inverseMatrix = new Ext.draw.Matrix();
        }
    },

    setDirtyFlags: function (attr, changes) {
        Ext.apply(attr, changes);
        var sprite = this._sprite,
            dirtyTriggers = sprite.self.def._dirtyTriggers,
            name, dirtyFlags = attr.dirtyFlags, flags, any = false,
            triggers, trigger, i, ln, canvasNames;

        for (name in changes) {
            if ((triggers = dirtyTriggers[name])) {
                i = 0;
                while ((trigger = triggers[i++])) {
                    if (!(flags = dirtyFlags[trigger])) {
                        flags = dirtyFlags[trigger] = [];
                    }
                    flags.push(name);
                }
            }
        }

        for (name in changes) {
            any = true;
            break;
        }

        if (!any) {
            return;
        }

        // This can prevent sub objects to set duplicated attributes to
        // context.
        if (dirtyFlags.canvas) {
            canvasNames = dirtyFlags.canvas;
            delete dirtyFlags.canvas;
            for (i = 0, ln = canvasNames.length; i < ln; i++) {
                name = canvasNames[i];
                attr.canvasAttributes[name] = attr[name];
            }
        }

        // Spreading dirty flags to children
        if (attr.hasOwnProperty('children')) {
            for (i = 0, ln = attr.children.length; i < ln; i++) {
                Ext.apply(attr.children[i].dirtyFlags, dirtyFlags);
                sprite.updateDirtyFlags(attr.children[i]);
            }
        }

        sprite.setDirty(true);
    },

    popUp: function (attributes, changes) {
        this.setDirtyFlags(attributes, changes);
        this._sprite.updateDirtyFlags(attributes);
    },

    pushDown: function (attr, changes) {
        if (this._previous) {
            changes = this._previous.pushDown(attr, changes);
        }
        this.setDirtyFlags(attr, changes);
        this._sprite.updateDirtyFlags(attr);
        return changes;
    }
});