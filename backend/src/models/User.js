const { Schema, model } = require('mongoose');

const ROLES = ['TEACHER', 'STUDENT'];

const userSchema = new Schema(
    {
        role: {
            type: String,
            enum: { values: ROLES, message: 'role must be TEACHER or STUDENT' },
            required: [true, 'role is required'],
        },
        fullName: {
            type: String,
            required: [true, 'fullName is required'],
            trim: true,
            minlength: [1, 'fullName cannot be empty'],
        },
        email: {
            type: String,
            required: [true, 'email is required'],
            trim: true,
            lowercase: true,
            match: [/^.+@.+\..+$/, 'email is not valid'],
        },
        passwordHash: {
            type: String,
            required: [true, 'passwordHash is required'],
            minlength: [1, 'passwordHash cannot be empty'],
            select: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'Group',
            default: null,
        },
    },
    { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ groupId: 1 });

// Only one TEACHER may exist in the whole database.
userSchema.index(
    { role: 1 },
    {
        unique: true,
        partialFilterExpression: { role: 'TEACHER' },
        name: 'users_single_teacher',
    },
);

userSchema.pre('validate', function enforceSingleTeacherGroup() {
    // groupId is meaningful for STUDENT records only.
    if (this.role === 'TEACHER' && this.groupId !== null && this.groupId !== undefined) {
        this.invalidate('groupId', 'A TEACHER cannot belong to a group');
    }
});

userSchema.set('toJSON', {
    transform(_document, ret) {
        delete ret.passwordHash;
        return ret;
    },
});

module.exports = model('User', userSchema);
module.exports.ROLES = ROLES;
